/**
 * Unit tests for EmployeeService.
 *
 * These run WITHOUT a database. The service depends on the `IEmployeeRepo`
 * port, so we pass a typed in-memory fake (no `as any`). The only infra seam
 * that still touches a `db` is `checkConflict`, so the fake repo exposes a
 * tiny `db` stub whose `select(...).from(...).where(...).limit(...)` resolves
 * to "no conflict".
 */

import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	EmployeeDto,
	EmployeeFilterDto,
} from '@/modules/hr/employee/employee.contract'
import type { IEmployeeRepo } from '@/modules/hr/employee/employee.repo'
import { EmployeeService } from '@/modules/hr/employee/employee.service'

import { createMockCacheClient } from '../helpers/mock-db'
import { beforeEach, describe, expect, test } from 'bun:test'

async function expectReject(promise: Promise<unknown>): Promise<void> {
	let threw = false
	try {
		await promise
	} catch {
		threw = true
	}
	expect(threw).toBe(true)
}

const noConflictDb = {
	select: () => ({
		from: () => ({
			where: () => ({
				limit: async () => [] as { id: number }[],
			}),
		}),
	}),
} as unknown as DbContext

class FakeEmployeeRepo implements IEmployeeRepo {
	readonly db = noConflictDb
	store = new Map<number, EmployeeDto>()
	private seq = 0

	seed(rows: EmployeeDto[]): void {
		for (const r of rows) {
			this.store.set(r.id, r)
			this.seq = Math.max(this.seq, r.id)
		}
	}

	async findMany(_filter?: EmployeeFilterDto): Promise<EmployeeDto[]> {
		return [...this.store.values()]
	}

	async findPage(filter: EmployeeFilterDto): Promise<WithPaginationResult<EmployeeDto>> {
		const data = [...this.store.values()]
		const limit = filter.limit ?? 10
		return {
			data,
			meta: {
				total: data.length,
				page: filter.page ?? 1,
				limit,
				totalPages: Math.max(1, Math.ceil(data.length / limit)),
			},
		}
	}

	async findById(id: number): Promise<EmployeeDto | undefined> {
		return this.store.get(id)
	}

	async findByIds(ids: number[]): Promise<EmployeeDto[]> {
		return ids.map((id) => this.store.get(id)).filter((x): x is EmployeeDto => x !== undefined)
	}

	async insert(data: Parameters<IEmployeeRepo['insert']>[0]): Promise<EntityRef | undefined> {
		const id = ++this.seq
		this.store.set(id, { ...(data as unknown as EmployeeDto), id })
		return { id }
	}

	async update(
		id: number,
		data: Parameters<IEmployeeRepo['update']>[1],
	): Promise<EntityRef | undefined> {
		const existing = this.store.get(id)
		if (!existing) return undefined
		this.store.set(id, { ...existing, ...(data as Partial<EmployeeDto>), id })
		return { id }
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		if (!this.store.has(id)) return undefined
		this.store.delete(id)
		return { id }
	}
}

function makeEmployee(overrides: Partial<EmployeeDto> = {}): EmployeeDto {
	return {
		id: 1,
		code: 'EMP-001',
		name: 'John Doe',
		email: 'john@example.com',
		phone: '+1234567890',
		jobTitle: 'Engineer',
		department: 'Engineering',
		userId: null,
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		deletedBy: null,
		deletedAt: null,
		...overrides,
	}
}

describe('EmployeeService (unit)', () => {
	let repo: FakeEmployeeRepo
	let service: EmployeeService

	beforeEach(() => {
		repo = new FakeEmployeeRepo()
		service = new EmployeeService(repo, createMockCacheClient() as never)
	})

	describe('handleGetById', () => {
		test('returns the employee when it exists', async () => {
			repo.seed([makeEmployee({ id: 1 })])
			const result = await service.handleGetById(1)
			expect(result.id).toBe(1)
			expect(result.code).toBe('EMP-001')
		})

		test('throws NotFound when missing', async () => {
			await expectReject(service.handleGetById(999))
		})
	})

	describe('handleCreate', () => {
		test('creates and returns a ref, applying the audit stamp', async () => {
			const actor = 7
			const result = await service.handleCreate(
				{
					code: 'EMP-NEW',
					name: 'New Employee',
					email: 'new@example.com',
					phone: '+0987654321',
					jobTitle: 'Designer',
					department: 'Design',
					userId: null,
				},
				actor,
			)

			expect(result.id).toBeDefined()
			const stored = await repo.findById(result.id)
			expect(stored?.code).toBe('EMP-NEW')
			expect(stored?.createdBy).toBe(actor)
		})
	})

	describe('handleUpdate', () => {
		test('updates an existing employee and stamps updatedBy', async () => {
			repo.seed([makeEmployee({ id: 1, name: 'Old Name' })])

			const dto = {
				id: 1,
				code: 'EMP-001',
				name: 'Updated Name',
				email: 'updated@example.com',
				phone: '+1234567890',
				jobTitle: 'Senior Engineer',
				department: 'Engineering',
				userId: null,
			}
			const result = await service.handleUpdate(dto, 9)

			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.name).toBe('Updated Name')
			expect(stored?.updatedBy).toBe(9)
		})

		test('throws NotFound when updating a missing employee', async () => {
			const dto = {
				id: 404,
				code: 'X',
				name: 'X',
				email: null,
				phone: null,
				jobTitle: null,
				department: null,
				userId: null,
			}
			await expectReject(service.handleUpdate(dto, 1))
		})
	})

	describe('handleRemove', () => {
		test('marks an existing employee as deleted', async () => {
			repo.seed([makeEmployee({ id: 1 })])
			const result = await service.handleRemove(1, 5)
			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.deletedAt).toBeDefined()
			expect(stored?.deletedBy).toBe(5)
		})

		test('throws NotFound when removing a missing employee', async () => {
			await expectReject(service.handleRemove(999, 1))
		})
	})

	describe('handleList', () => {
		test('returns a paginated list', async () => {
			repo.seed([makeEmployee({ id: 1 }), makeEmployee({ id: 2, code: 'EMP-002' })])
			const result = await service.handleList({ page: 1, limit: 10, q: undefined })
			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})
	})
})

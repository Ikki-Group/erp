/**
 * Unit tests for SalesTypeService.
 *
 * These run WITHOUT a database. The service depends on the `ISalesTypeRepo`
 * port, so we pass a typed in-memory fake (no `as any`). The only infra seam
 * that still touches a `db` is `checkConflict`, so the fake repo exposes a
 * tiny `db` stub whose `select(...).from(...).where(...).limit(...)` resolves
 * to "no conflict".
 */

import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	SalesTypeDto,
	SalesTypeFilterDto,
	SalesTypeUpdateDto,
} from '@/modules/sales-type/sales-type.contract'
import type { ISalesTypeRepo } from '@/modules/sales-type/sales-type.repo'
import { SalesTypeService } from '@/modules/sales-type/sales-type.service'

import { createMockCacheClient } from '../helpers/mock-db'
import { beforeEach, describe, expect, test } from 'bun:test'

/** Assert that a promise rejects (type-aware-lint friendly alternative to `.rejects`). */
async function expectReject(promise: Promise<unknown>): Promise<void> {
	let threw = false
	try {
		await promise
	} catch {
		threw = true
	}
	expect(threw).toBe(true)
}

/** A `db` stub that always reports "no conflict" for checkConflict queries. */
const noConflictDb = {
	select: () => ({
		from: () => ({
			where: () => ({
				limit: async () => [] as { id: number }[],
			}),
		}),
	}),
} as unknown as DbContext

/** Typed in-memory fake implementing the ISalesTypeRepo port. */
class FakeSalesTypeRepo implements ISalesTypeRepo {
	readonly db = noConflictDb
	store = new Map<number, SalesTypeDto>()
	private seq = 0

	seed(rows: SalesTypeDto[]): void {
		for (const r of rows) {
			this.store.set(r.id, r)
			this.seq = Math.max(this.seq, r.id)
		}
	}

	async findMany(_filter?: SalesTypeFilterDto): Promise<SalesTypeDto[]> {
		return [...this.store.values()]
	}

	async findPage(filter: SalesTypeFilterDto): Promise<WithPaginationResult<SalesTypeDto>> {
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

	async findById(id: number): Promise<SalesTypeDto | undefined> {
		return this.store.get(id)
	}

	async findByIds(ids: number[]): Promise<SalesTypeDto[]> {
		return ids.map((id) => this.store.get(id)).filter((v): v is SalesTypeDto => v !== undefined)
	}

	async count(): Promise<number> {
		return this.store.size
	}

	async insert(data: Parameters<ISalesTypeRepo['insert']>[0]): Promise<EntityRef | undefined> {
		const id = ++this.seq
		this.store.set(id, { ...(data as unknown as SalesTypeDto), id })
		return { id }
	}

	async insertMany(items: Parameters<ISalesTypeRepo['insertMany']>[0]): Promise<void> {
		for (const item of items) await this.insert(item)
	}

	async update(
		id: number,
		data: Parameters<ISalesTypeRepo['update']>[1],
	): Promise<EntityRef | undefined> {
		const existing = this.store.get(id)
		if (!existing) return undefined
		this.store.set(id, { ...existing, ...(data as Partial<SalesTypeDto>), id })
		return { id }
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		if (!this.store.has(id)) return undefined
		this.store.delete(id)
		return { id }
	}
}

function makeSalesType(overrides: Partial<SalesTypeDto> = {}): SalesTypeDto {
	return {
		id: 1,
		code: 'DINE_IN',
		name: 'Dine In',
		isSystem: false,
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe('SalesTypeService (unit)', () => {
	let repo: FakeSalesTypeRepo
	let service: SalesTypeService

	beforeEach(() => {
		repo = new FakeSalesTypeRepo()
		service = new SalesTypeService(repo, createMockCacheClient() as never)
	})

	describe('handleGetById', () => {
		test('returns the sales type when it exists', async () => {
			repo.seed([makeSalesType({ id: 1 })])
			const result = await service.handleGetById(1)
			expect(result.id).toBe(1)
			expect(result.code).toBe('DINE_IN')
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
					code: 'TAKEAWAY',
					name: 'Takeaway',
					isSystem: false,
				},
				actor,
			)

			expect(result.id).toBeDefined()
			const stored = await repo.findById(result.id)
			expect(stored?.code).toBe('TAKEAWAY')
			expect(stored?.createdBy).toBe(actor)
		})
	})

	describe('handleUpdate', () => {
		test('updates an existing sales type and stamps updatedBy', async () => {
			repo.seed([makeSalesType({ id: 1, name: 'Old' })])

			const dto: SalesTypeUpdateDto = {
				id: 1,
				code: 'DINE_IN',
				name: 'Updated',
				isSystem: false,
			}
			const result = await service.handleUpdate(dto, 9)

			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.name).toBe('Updated')
			expect(stored?.updatedBy).toBe(9)
		})

		test('throws NotFound when updating a missing sales type', async () => {
			const dto: SalesTypeUpdateDto = {
				id: 404,
				code: 'X',
				name: 'X',
				isSystem: false,
			}
			await expectReject(service.handleUpdate(dto, 1))
		})

		test('throws BadRequest when updating a system sales type', async () => {
			repo.seed([makeSalesType({ id: 1, isSystem: true })])
			const dto: SalesTypeUpdateDto = {
				id: 1,
				code: 'DINE_IN',
				name: 'Updated',
				isSystem: true,
			}
			await expectReject(service.handleUpdate(dto, 1))
		})
	})

	describe('handleDelete', () => {
		test('removes an existing sales type', async () => {
			repo.seed([makeSalesType({ id: 1 })])
			const result = await service.handleDelete(1)
			expect(result.id).toBe(1)
			expect(await repo.findById(1)).toBeUndefined()
		})

		test('throws NotFound when deleting a missing sales type', async () => {
			await expectReject(service.handleDelete(999))
		})

		test('throws BadRequest when deleting a system sales type', async () => {
			repo.seed([makeSalesType({ id: 1, isSystem: true })])
			await expectReject(service.handleDelete(1))
		})
	})

	describe('handleList', () => {
		test('returns a paginated list', async () => {
			repo.seed([makeSalesType({ id: 1 }), makeSalesType({ id: 2, code: 'TAKEAWAY' })])
			const result = await service.handleList({ page: 1, limit: 10, q: undefined })
			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})
	})
})

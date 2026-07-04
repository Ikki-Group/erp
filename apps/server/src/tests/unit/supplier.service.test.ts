import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type { SupplierDto, SupplierFilterDto, SupplierUpdateDto } from '@/modules/supplier/supplier.contract'
import type { ISupplierRepo } from '@/modules/supplier/supplier.repo'
import { SupplierService } from '@/modules/supplier/supplier.service'

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

class FakeSupplierRepo implements ISupplierRepo {
	readonly db = noConflictDb
	store = new Map<number, SupplierDto>()
	private seq = 0

	seed(rows: SupplierDto[]): void {
		for (const r of rows) {
			this.store.set(r.id, r)
			this.seq = Math.max(this.seq, r.id)
		}
	}

	async findMany(_filter?: SupplierFilterDto): Promise<SupplierDto[]> {
		return [...this.store.values()]
	}

	async findPage(filter: SupplierFilterDto): Promise<WithPaginationResult<SupplierDto>> {
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

	async findById(id: number): Promise<SupplierDto | undefined> {
		return this.store.get(id)
	}

	async findByIds(ids: number[]): Promise<SupplierDto[]> {
		if (ids.length === 0) return []
		return ids.map((id) => this.store.get(id)).filter((v): v is SupplierDto => v !== undefined)
	}

	async insert(data: Parameters<ISupplierRepo['insert']>[0]): Promise<EntityRef | undefined> {
		const id = ++this.seq
		this.store.set(id, { ...(data as unknown as SupplierDto), id })
		return { id }
	}

	async insertMany(items: Parameters<ISupplierRepo['insertMany']>[0]): Promise<void> {
		for (const item of items) await this.insert(item)
	}

	async update(
		id: number,
		data: Parameters<ISupplierRepo['update']>[1],
	): Promise<EntityRef | undefined> {
		const existing = this.store.get(id)
		if (!existing) return undefined
		this.store.set(id, { ...existing, ...(data as Partial<SupplierDto>), id })
		return { id }
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		if (!this.store.has(id)) return undefined
		this.store.delete(id)
		return { id }
	}
}

function makeSupplier(overrides: Partial<SupplierDto> = {}): SupplierDto {
	return {
		id: 1,
		code: 'SUP-001',
		name: 'Supplier 1',
		email: 'supplier@example.com',
		phone: '+1234567890',
		address: '123 Main St',
		taxId: 'TAX-001',
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe('SupplierService (unit)', () => {
	let repo: FakeSupplierRepo
	let service: SupplierService

	beforeEach(() => {
		repo = new FakeSupplierRepo()
		service = new SupplierService(repo, createMockCacheClient() as never)
	})

	describe('handleGetById', () => {
		test('returns the supplier when it exists', async () => {
			repo.seed([makeSupplier({ id: 1 })])
			const result = await service.handleGetById(1)
			expect(result.id).toBe(1)
			expect(result.code).toBe('SUP-001')
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
					code: 'SUP-NEW',
					name: 'New Supplier',
					email: null,
					phone: null,
					address: null,
					taxId: null,
				},
				actor,
			)

			expect(result.id).toBeDefined()
			const stored = await repo.findById(result.id)
			expect(stored?.code).toBe('SUP-NEW')
			expect(stored?.createdBy).toBe(actor)
		})
	})

	describe('handleUpdate', () => {
		test('updates an existing supplier and stamps updatedBy', async () => {
			repo.seed([makeSupplier({ id: 1, name: 'Old' })])

			const dto: SupplierUpdateDto = {
				id: 1,
				code: 'SUP-001',
				name: 'Updated',
				email: null,
				phone: null,
				address: null,
				taxId: null,
			}
			const result = await service.handleUpdate(dto, 9)

			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.name).toBe('Updated')
			expect(stored?.updatedBy).toBe(9)
		})

		test('throws NotFound when updating a missing supplier', async () => {
			const dto: SupplierUpdateDto = {
				id: 404,
				code: 'X',
				name: 'X',
				email: null,
				phone: null,
				address: null,
				taxId: null,
			}
			await expectReject(service.handleUpdate(dto, 1))
		})
	})

	describe('handleDelete', () => {
		test('removes an existing supplier', async () => {
			repo.seed([makeSupplier({ id: 1 })])
			const result = await service.handleDelete(1, 1)
			expect(result?.id).toBe(1)
			expect(await repo.findById(1)).toBeUndefined()
		})

		test('throws NotFound when deleting a missing supplier', async () => {
			await expectReject(service.handleDelete(999, 1))
		})
	})

	describe('handleList', () => {
		test('returns a paginated list', async () => {
			repo.seed([makeSupplier({ id: 1 }), makeSupplier({ id: 2, code: 'SUP-002' })])
			const result = await service.handleList({ page: 1, limit: 10, q: undefined })
			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})
	})

	describe('getByIds', () => {
		test('returns suppliers for given ids', async () => {
			repo.seed([makeSupplier({ id: 1 }), makeSupplier({ id: 2, code: 'SUP-002' })])
			const result = await service.getByIds([1, 2])
			expect(result.length).toBe(2)
			if (result[0]) expect(result[0].id).toBe(1)
			if (result[1]) expect(result[1].id).toBe(2)
		})

		test('returns empty array for empty ids', async () => {
			const result = await service.getByIds([])
			expect(result.length).toBe(0)
		})
	})
})

import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	ProductCategoryDto,
	ProductCategoryFilterDto,
	ProductCategoryUpdateDto,
} from '@/modules/product/category/category.contract'
import type { IProductCategoryRepo } from '@/modules/product/category/category.repo'
import { ProductCategoryService } from '@/modules/product/category/category.service'

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

class FakeProductCategoryRepo implements IProductCategoryRepo {
	readonly db = noConflictDb
	store = new Map<number, ProductCategoryDto>()
	private seq = 0

	seed(rows: ProductCategoryDto[]): void {
		for (const r of rows) {
			this.store.set(r.id, r)
			this.seq = Math.max(this.seq, r.id)
		}
	}

	async findMany(locationId?: number): Promise<ProductCategoryDto[]> {
		const all = [...this.store.values()]
		if (locationId === undefined) return all
		return all.filter((r) => r.locationId === locationId)
	}

	async findPage(filter: ProductCategoryFilterDto): Promise<WithPaginationResult<ProductCategoryDto>> {
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

	async findById(id: number): Promise<ProductCategoryDto | undefined> {
		return this.store.get(id)
	}

	async insert(data: Parameters<IProductCategoryRepo['insert']>[0]): Promise<EntityRef | undefined> {
		const id = ++this.seq
		this.store.set(id, { ...(data as unknown as ProductCategoryDto), id })
		return { id }
	}

	async update(
		id: number,
		data: Parameters<IProductCategoryRepo['update']>[1],
	): Promise<EntityRef | undefined> {
		const existing = this.store.get(id)
		if (!existing) return undefined
		this.store.set(id, { ...existing, ...(data as Partial<ProductCategoryDto>), id })
		return { id }
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		if (!this.store.has(id)) return undefined
		this.store.delete(id)
		return { id }
	}
}

function makeCategory(overrides: Partial<ProductCategoryDto> = {}): ProductCategoryDto {
	return {
		id: 1,
		code: 'BEVERAGES',
		name: 'Beverages',
		description: null,
		locationId: 1,
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe('ProductCategoryService (unit)', () => {
	let repo: FakeProductCategoryRepo
	let service: ProductCategoryService

	beforeEach(() => {
		repo = new FakeProductCategoryRepo()
		service = new ProductCategoryService(repo, createMockCacheClient() as never)
	})

	describe('handleDetail', () => {
		test('returns the category when it exists', async () => {
			repo.seed([makeCategory({ id: 1 })])
			const result = await service.handleDetail(1)
			expect(result.id).toBe(1)
			expect(result.name).toBe('Beverages')
		})

		test('throws NotFound when missing', async () => {
			await expectReject(service.handleDetail(999))
		})
	})

	describe('handleCreate', () => {
		test('creates and returns a ref, applying the audit stamp', async () => {
			const actor = 7
			const result = await service.handleCreate(
				{
					code: 'SNACKS',
					name: 'Snacks',
					description: 'Snack items',
					locationId: 1,
				},
				actor,
			)

			expect(result.id).toBeDefined()
			const stored = await repo.findById(result.id)
			expect(stored?.name).toBe('Snacks')
			expect(stored?.code).toBe('SNACKS')
			expect(stored?.createdBy).toBe(actor)
		})
	})

	describe('handleUpdate', () => {
		test('updates an existing category and stamps updatedBy', async () => {
			repo.seed([makeCategory({ id: 1, name: 'Old' })])

			const dto: ProductCategoryUpdateDto = {
				id: 1,
				code: 'UPDATED',
				name: 'Updated',
				description: 'Updated description',
				locationId: 1,
			}
			const result = await service.handleUpdate(dto.id, dto, 9)

			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.name).toBe('Updated')
			expect(stored?.code).toBe('UPDATED')
			expect(stored?.updatedBy).toBe(9)
		})

		test('throws NotFound when updating a missing category', async () => {
			const dto: ProductCategoryUpdateDto = {
				id: 404,
				code: 'X',
				name: 'X',
				description: null,
				locationId: 1,
			}
			await expectReject(service.handleUpdate(dto.id, dto, 1))
		})
	})

	describe('handleRemove', () => {
		test('removes an existing category', async () => {
			repo.seed([makeCategory({ id: 1 })])
			const result = await service.handleRemove(1)
			expect(result.id).toBe(1)
			expect(await repo.findById(1)).toBeUndefined()
		})

		test('throws NotFound when deleting a missing category', async () => {
			await expectReject(service.handleRemove(999))
		})
	})

	describe('handleList', () => {
		test('returns a paginated list', async () => {
			repo.seed([makeCategory({ id: 1 }), makeCategory({ id: 2, name: 'Food' })])
			const result = await service.handleList({ page: 1, limit: 10, q: undefined })
			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})
	})

	describe('getAll', () => {
		test('returns all categories', async () => {
			repo.seed([makeCategory({ id: 1 }), makeCategory({ id: 2, name: 'Food' })])
			const result = await service.getAll()
			expect(result.length).toBe(2)
		})

		test('filters by locationId', async () => {
			repo.seed([
				makeCategory({ id: 1, locationId: 1 }),
				makeCategory({ id: 2, locationId: 2 }),
			])
			const result = await service.getAll(1)
			expect(result.length).toBe(1)
			expect(result[0]?.locationId).toBe(1)
		})
	})
})

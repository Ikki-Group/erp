/**
 * Unit tests for ProductService.
 *
 * These run WITHOUT a database. The service depends on the `IProductRepo`
 * port, so we pass a typed in-memory fake (no `as any`). The only infra seam
 * that still touches a `db` is `checkConflict`, so the fake repo exposes a
 * tiny `db` stub whose `select(...).from(...).where(...).limit(...)` resolves
 * to "no conflict".
 */

import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	ProductDto,
	ProductFilterDto,
} from '@/modules/product/product.contract'
import type { ProductCategoryDto } from '@/modules/product/category/category.contract'
import type { IProductRepo } from '@/modules/product/product.repo'
import { ProductService } from '@/modules/product/product.service'

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

class FakeProductRepo implements IProductRepo {
	readonly db = noConflictDb
	store = new Map<number, ProductDto>()
	private seq = 0

	seed(rows: ProductDto[]): void {
		for (const r of rows) {
			this.store.set(r.id, r)
			this.seq = Math.max(this.seq, r.id)
		}
	}

	async findById(id: number): Promise<ProductDto | undefined> {
		return this.store.get(id)
	}

	async findPage(filter: ProductFilterDto): Promise<WithPaginationResult<ProductDto>> {
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

	async checkScopedConflict(): Promise<{ sku: string; name: string } | undefined> {
		return undefined
	}

	async insert(data: Parameters<IProductRepo['insert']>[0]): Promise<EntityRef | undefined> {
		const id = ++this.seq
		this.store.set(id, { ...(data as unknown as ProductDto), id })
		return { id }
	}

	async insertProductPrices(): Promise<void> {}

	async insertVariant(): Promise<EntityRef | undefined> {
		const id = ++this.seq
		return { id }
	}

	async insertVariantPrices(): Promise<void> {}

	async deleteProductPrices(): Promise<void> {}

	async deleteVariants(): Promise<void> {}

	async updateProduct(id: number, data: Parameters<IProductRepo['updateProduct']>[1]): Promise<EntityRef | undefined> {
		const existing = this.store.get(id)
		if (!existing) return undefined
		this.store.set(id, { ...existing, ...(data as unknown as ProductDto), id })
		return { id }
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		if (!this.store.has(id)) return undefined
		this.store.delete(id)
		return { id }
	}
}

class FakeCategoryRepo {
	readonly db = noConflictDb
	private store = new Map<number, ProductCategoryDto>()

	seed(rows: ProductCategoryDto[]): void {
		for (const r of rows) {
			this.store.set(r.id, r)
		}
	}

	async findById(id: number): Promise<ProductCategoryDto | undefined> {
		return this.store.get(id)
	}
}

function makeProduct(overrides: Partial<ProductDto> = {}): ProductDto {
	return {
		id: 1,
		name: 'Test Product',
		description: null,
		sku: 'TEST-001',
		basePrice: '100',
		locationId: 1,
		categoryId: null,
		status: 'active',
		hasVariants: false,
		hasSalesTypePricing: false,
		variants: [],
		prices: [],
		externalMappings: [],
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe('ProductService (unit)', () => {
	let categoryRepo: FakeCategoryRepo
	let repo: FakeProductRepo
	let service: ProductService

	beforeEach(() => {
		categoryRepo = new FakeCategoryRepo()
		repo = new FakeProductRepo()
		service = new ProductService(categoryRepo, repo, createMockCacheClient() as never)
	})

	describe('handleDetail', () => {
		test('returns the product when it exists', async () => {
			repo.seed([makeProduct({ id: 1 })])
			const result = await service.handleDetail(1)
			expect(result.id).toBe(1)
			expect(result.sku).toBe('TEST-001')
		})

		test('throws NotFound when missing', async () => {
			await expectReject(service.handleDetail(999))
		})
	})

	describe('handleList', () => {
		test('returns paginated list', async () => {
			repo.seed([makeProduct({ id: 1 }), makeProduct({ id: 2, sku: 'TEST-002' })])
			const result = await service.handleList({ page: 1, limit: 10, search: undefined, isExternal: false })
			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})
	})

	describe('handleRemove', () => {
		test('removes an existing product', async () => {
			repo.seed([makeProduct({ id: 1 })])
			const result = await service.handleRemove(1)
			expect(result.id).toBe(1)
			expect(await repo.findById(1)).toBeUndefined()
		})

		test('throws NotFound when removing missing', async () => {
			await expectReject(service.handleRemove(999))
		})
	})
})

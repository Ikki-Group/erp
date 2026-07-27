import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	RecipeDto,
	RecipeFilterDto,
	RecipeUpdateDto,
	RecipeItemDto,
	RecipeCreateDto,
} from '@/modules/recipe/recipe.contract'
import type { IRecipeRepo, RecipeItemInput } from '@/modules/recipe/recipe.repo'
import { RecipeService } from '@/modules/recipe/recipe.service'

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

class FakeRecipeRepo implements IRecipeRepo {
	readonly db = noConflictDb
	store = new Map<number, RecipeDto>()
	private seq = 0

	seed(rows: RecipeDto[]): void {
		for (const r of rows) {
			this.store.set(r.id, r)
			this.seq = Math.max(this.seq, r.id)
		}
	}

	async findById(id: number): Promise<RecipeDto | undefined> {
		return this.store.get(id)
	}

	async findPage(filter: RecipeFilterDto): Promise<WithPaginationResult<RecipeDto>> {
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

	async findManyByMaterialId(_materialId: number): Promise<RecipeDto[]> {
		return [...this.store.values()]
	}

	async count(): Promise<number> {
		return this.store.size
	}

	async insert(
		data: Parameters<IRecipeRepo['insert']>[0],
		items: RecipeItemInput[],
	): Promise<EntityRef | undefined> {
		const id = ++this.seq
		const recipe: RecipeDto = {
			id,
			materialId: data.materialId ?? null,
			productId: data.productId ?? null,
			productVariantId: data.productVariantId ?? null,
			targetQty: data.targetQty?.toString() ?? '1',
			targetUomId: data.targetUomId ?? 1,
			isActive: data.isActive ?? true,
			instructions: data.instructions ?? null,
			items: items.map((item, idx) => ({
				id: idx + 1,
				recipeId: id,
				materialId: item.materialId ?? 1,
				qty: item.qty?.toString() ?? '0',
				scrapPercentage: item.scrapPercentage?.toString() ?? '0',
				uomId: item.uomId ?? 1,
				notes: item.notes ?? null,
				sortOrder: Number(item.sortOrder ?? 0),
				createdBy: 1,
				updatedBy: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			})),
			createdBy: 1,
			updatedBy: 1,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		this.store.set(id, recipe)
		return { id }
	}

	async update(
		id: number,
		data: Parameters<IRecipeRepo['update']>[1],
		items: RecipeItemInput[],
	): Promise<EntityRef | undefined> {
		const existing = this.store.get(id)
		if (!existing) return undefined
		const updated: RecipeDto = {
			...existing,
			materialId: data.materialId ?? existing.materialId,
			productId: data.productId ?? existing.productId,
			productVariantId: data.productVariantId ?? existing.productVariantId,
			targetQty: data.targetQty?.toString() ?? existing.targetQty,
			targetUomId: data.targetUomId ?? existing.targetUomId,
			isActive: data.isActive ?? existing.isActive,
			instructions: data.instructions ? data.instructions : existing.instructions,
			createdAt: existing.createdAt,
			updatedAt: existing.updatedAt,
			createdBy: existing.createdBy,
			updatedBy: existing.updatedBy,
			items: items.map((item, idx) => ({
				id: idx + 1,
				recipeId: id,
				materialId: item.materialId ?? 1,
				qty: item.qty?.toString() ?? '0',
				scrapPercentage: item.scrapPercentage?.toString() ?? '0',
				uomId: item.uomId ?? 1,
				notes: item.notes ?? null,
				sortOrder: Number(item.sortOrder ?? 0),
				createdBy: 1,
				updatedBy: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			})),
		}
		this.store.set(id, updated)
		return { id }
	}

	async remove(id: number, _deletedBy: number): Promise<EntityRef | undefined> {
		if (!this.store.has(id)) return undefined
		this.store.delete(id)
		return { id }
	}

	async getAvgCostForMaterial(_materialId: number): Promise<number> {
		return 10
	}
}

function makeRecipeItem(overrides: Partial<RecipeItemDto> = {}): RecipeItemDto {
	return {
		id: 1,
		recipeId: 1,
		materialId: 1,
		qty: '10',
		scrapPercentage: '0',
		uomId: 1,
		notes: null,
		sortOrder: 0,
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

function makeRecipe(overrides: Partial<RecipeDto> = {}): RecipeDto {
	return {
		id: 1,
		materialId: 1,
		productId: null,
		productVariantId: null,
		targetQty: '100',
		targetUomId: 1,
		isActive: true,
		instructions: null,
		items: [makeRecipeItem()],
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe('RecipeService (unit)', () => {
	let repo: FakeRecipeRepo
	let service: RecipeService

	beforeEach(() => {
		repo = new FakeRecipeRepo()
		service = new RecipeService(repo, createMockCacheClient() as never)
	})

	describe('handleDetail', () => {
		test('returns the recipe when it exists', async () => {
			repo.seed([makeRecipe({ id: 1 })])
			const result = await service.handleDetail(1)
			expect(result.id).toBe(1)
		})

		test('throws NotFound when missing', async () => {
			await expectReject(service.handleDetail(999))
		})
	})

	describe('handleCreate', () => {
		test('creates and returns a ref', async () => {
			const dto: RecipeCreateDto = {
				materialId: 1,
				productId: null,
				productVariantId: null,
				targetQty: '100',
				targetUomId: 1,
				isActive: true,
				instructions: null,
				items: [
					{
						materialId: 1,
						qty: '10',
						scrapPercentage: '0',
						uomId: 1,
						notes: null,
						sortOrder: 0,
					},
				],
			}
			const result = await service.handleCreate(dto, 7)
			expect(result.id).toBeDefined()
			const stored = await repo.findById(result.id)
			expect(stored?.materialId).toBe(1)
		})
	})

	describe('handleUpdate', () => {
		test('updates an existing recipe', async () => {
			repo.seed([makeRecipe({ id: 1 })])

			const dto: RecipeUpdateDto = {
				id: 1,
				materialId: 1,
				productId: null,
				productVariantId: null,
				targetQty: '200',
				targetUomId: 1,
				isActive: true,
				instructions: 'Updated',
				items: [
					{
						materialId: 1,
						qty: '20',
						scrapPercentage: '0',
						uomId: 1,
						notes: null,
						sortOrder: 0,
					},
				],
			}
			const result = await service.handleUpdate(dto, 9)
			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.targetQty).toBe('200')
			expect(stored?.instructions).toBe('Updated')
		})

		test('throws NotFound when updating a missing recipe', async () => {
			const dto: RecipeUpdateDto = {
				id: 404,
				materialId: 1,
				productId: null,
				productVariantId: null,
				targetQty: '100',
				targetUomId: 1,
				isActive: true,
				instructions: null,
				items: [
					{
						materialId: 1,
						qty: '10',
						scrapPercentage: '0',
						uomId: 1,
						notes: null,
						sortOrder: 0,
					},
				],
			}
			await expectReject(service.handleUpdate(dto, 1))
		})
	})

	describe('handleRemove', () => {
		test('removes an existing recipe', async () => {
			repo.seed([makeRecipe({ id: 1 })])
			const result = await service.handleRemove(1, 1)
			expect(result.id).toBe(1)
			expect(await repo.findById(1)).toBeUndefined()
		})

		test('throws NotFound when removing a missing recipe', async () => {
			await expectReject(service.handleRemove(999, 1))
		})
	})

	describe('handleList', () => {
		test('returns a paginated list', async () => {
			repo.seed([makeRecipe({ id: 1 }), makeRecipe({ id: 2 })])
			const result = await service.handleList({ page: 1, limit: 10, q: undefined, isActive: true })
			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})
	})

	describe('handleCalculateCost', () => {
		test('calculates cost for a recipe', async () => {
			repo.seed([makeRecipe({ id: 1, targetQty: '100' })])
			const result = await service.handleCalculateCost(1)
			expect(result.recipeId).toBe(1)
			expect(Number(result.totalCost)).toBeGreaterThan(0)
		})

		test('throws NotFound for missing recipe', async () => {
			await expectReject(service.handleCalculateCost(999))
		})
	})
})

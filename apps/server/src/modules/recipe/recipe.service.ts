import { record } from '@elysiajs/opentelemetry'

import { recipesTable } from '@/db/schema'
import { CacheService, type CacheClient } from '@/infra/cache'
import { checkConflict, type ConflictField, withTransaction } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	RecipeCostDto,
	RecipeCreateDto,
	RecipeDto,
	RecipeFilterDto,
	RecipeUpdateDto,
} from './recipe.contract'
import { RecipeError } from './recipe.internal'
import type { IRecipeRepo, RecipeItemInput } from './recipe.repo'

const uniqueFields: ConflictField<{ targetUomId: number }>[] = [
	{
		field: 'targetUomId',
		column: recipesTable.targetUomId,
		message: 'Target UOM is required',
		code: 'RECIPE_TARGET_UOM_REQUIRED',
	},
]

export class RecipeService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IRecipeRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'recipe')
	}

	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		await this.cache.deleteFromKeys(keys)
	}

	async getById(id: number): Promise<RecipeDto | undefined> {
		return record('RecipeService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.findById(id),
			}),
		)
	}

	async findManyByMaterialId(materialId: number): Promise<RecipeDto[]> {
		return this.repo.findManyByMaterialId(materialId)
	}

	async handleList(filter: RecipeFilterDto): Promise<WithPaginationResult<RecipeDto>> {
		return record('RecipeService.handleList', async () =>
			this.cache.getOrSet({
				key: `list:${JSON.stringify(filter)}`,
				factory: () => this.repo.findPage(filter),
			}),
		)
	}

	async handleDetail(id: number): Promise<RecipeDto> {
		return record('RecipeService.handleDetail', async () => {
			const result = await this.getById(id)
			if (!result) throw RecipeError.notFound(id)
			return result
		})
	}

	private buildRecipeItems(items: RecipeCreateDto['items'], actorId: ActorId): RecipeItemInput[] {
		return items.map((item) => ({
			materialId: item.materialId,
			qty: item.qty.toString(),
			scrapPercentage: (item.scrapPercentage ?? '0').toString(),
			uomId: item.uomId,
			notes: item.notes,
			sortOrder: (item.sortOrder ?? 0),
			...stampCreate(actorId),
		}))
	}

	async handleCreate(data: RecipeCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('RecipeService.handleCreate', async () => {
			await checkConflict({
				db: this.repo.db,
				table: recipesTable,
				pkColumn: recipesTable.id,
				fields: uniqueFields,
				input: { targetUomId: data.targetUomId },
			})

			const result = await withTransaction(this.repo.db, async (tx) => {
				const created = await this.repo.insert(
					{
						materialId: data.materialId ?? null,
						productId: data.productId ?? null,
						productVariantId: data.productVariantId ?? null,
						targetQty: (data.targetQty ?? 1).toString(),
						targetUomId: data.targetUomId,
						isActive: data.isActive,
						instructions: data.instructions,
						...stampCreate(actorId),
					},
					this.buildRecipeItems(data.items, actorId),
					tx,
				)
				if (!created) throw RecipeError.createFailed()
				return created
			})

			await this.invalidate()
			return result
		})
	}

	async handleUpdate(data: RecipeUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('RecipeService.handleUpdate', async () => {
			const { id } = data
			const existing = await this.getById(id)
			if (!existing) throw RecipeError.notFound(id)

			const result = await withTransaction(this.repo.db, async (tx) => {
				const updated = await this.repo.update(
					id,
					{
						materialId: data.materialId === undefined ? existing.materialId : data.materialId,
						productId: data.productId === undefined ? existing.productId : data.productId,
						productVariantId:
							data.productVariantId === undefined
								? existing.productVariantId
								: data.productVariantId,
						targetQty: (data.targetQty ?? existing.targetQty).toString(),
						targetUomId: data.targetUomId,
						isActive: data.isActive ?? existing.isActive,
						instructions: data.instructions === undefined ? existing.instructions : data.instructions,
						...stampUpdate(actorId),
					},
					this.buildRecipeItems(data.items, actorId),
					tx,
				)
				if (!updated) throw RecipeError.notFound(id)
				return updated
			})

			await this.invalidate(id)
			return result
		})
	}

	async handleRemove(id: number, _actorId: ActorId): Promise<EntityRef> {
		return record('RecipeService.handleRemove', async () => {
			const existing = await this.getById(id)
			if (!existing) throw RecipeError.notFound(id)

			const result = await this.repo.remove(id)
			if (!result) throw RecipeError.notFound(id)

			await this.invalidate(id)
			return result
		})
	}

	async handleCalculateCost(recipeId: number): Promise<RecipeCostDto> {
		return record('RecipeService.handleCalculateCost', async () => {
			const recipe = await this.getById(recipeId)
			if (!recipe) throw RecipeError.notFound(recipeId)

			const items = recipe.items ?? []
			let totalCost = 0
			const detailedItems = []

			for (const item of items) {
				const avgCost = await this.repo.getAvgCostForMaterial(item.materialId)
				const qty = Number(item.qty)
				const scrap = Number(item.scrapPercentage)
				const scrapFactor = 1 + scrap / 100
				const itemCost = qty * scrapFactor * avgCost

				totalCost += itemCost
				detailedItems.push({
					...item,
					unitCost: avgCost.toString(),
					extendedCost: itemCost.toString(),
				})
			}

			const targetQty = Number(recipe.targetQty)
			const unitCost = targetQty > 0 ? totalCost / targetQty : totalCost

			return {
				recipeId,
				targetQty: targetQty.toString(),
				totalCost: totalCost.toString(),
				unitCost: unitCost.toString(),
				items: detailedItems,
			}
		})
	}
}

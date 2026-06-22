import Decimal from 'decimal.js'

import { CacheService, type CacheClient } from '@/infra/cache'

import { ConflictError, NotFoundError } from '@/shared/errors/http-error'

import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import { RecipeRepo } from './recipe.repo'
import type {
	RecipeCostSchema,
	RecipeCreateSchema,
	RecipeSchema,
	RecipeFilterSchema,
	RecipeSelectSchema,
	RecipeUpdateSchema,
} from './recipe.schema'

const err = {
	notFound: (id: number) => new NotFoundError(`Recipe with ID ${id} not found`, { code: 'RECIPE_NOT_FOUND' }),
	targetMissing: () =>
		new ConflictError('Recipe must have exactly one target', { code: 'RECIPE_MISSING_TARGET' }),
	targetExists: () =>
		new ConflictError('A recipe already exists for this target', { code: 'RECIPE_TARGET_ALREADY_EXISTS' }),
}

export class RecipeService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: RecipeRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'recipe')
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<RecipeSchema> {
		const key = `byId:${id}`
		const recipe = await this.cache.getOrSetWithSkip({
			key,
			factory: () => this.repo.getById(id),
		})
		if (!recipe) throw err.notFound(id)
		return recipe
	}

	async count(): Promise<number> {
		const key = 'count'
		return this.cache.getOrSet({
			key,
			factory: () => this.repo.count(),
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: RecipeFilterSchema): Promise<WithPaginationResult<RecipeSelectSchema>> {
		const key = `list.${JSON.stringify(filter)}`
		return this.cache.getOrSet({
			key,
			factory: () => this.repo.getListPaginated(filter),
		})
	}

	async handleDetail(id: number): Promise<RecipeSelectSchema> {
		return this.getById(id)
	}

	async handleCreate(data: RecipeCreateSchema, actorId: ActorId): Promise<EntityRef> {
		const hasConflict = await this.repo.checkTargetConflict({
			materialId: data.materialId,
			productId: data.productId,
			productVariantId: data.productVariantId,
		})

		if (!hasConflict && !data.materialId && !data.productId && !data.productVariantId) {
			throw err.targetMissing()
		}

		if (hasConflict) {
			throw err.targetExists()
		}

		const result = await this.repo.create(data, actorId)
		await this.cache.deleteMany({ keys: ['list', 'count'] })
		return result
	}

	async handleUpdate(data: RecipeUpdateSchema, actorId: ActorId): Promise<EntityRef> {
		const existing = await this.getById(data.id)

		const target = {
			materialId: data.materialId === undefined ? existing.materialId : data.materialId,
			productId: data.productId === undefined ? existing.productId : data.productId,
			productVariantId:
				data.productVariantId === undefined ? existing.productVariantId : data.productVariantId,
		}

		const hasConflict = await this.repo.checkTargetConflict(target, data.id)
		if (hasConflict) {
			throw err.targetExists()
		}

		const result = await this.repo.update(data, actorId)
		await this.cache.deleteMany({ keys: ['list', 'count', `byId:${data.id}`] })
		return result
	}

	async handleRemove(id: number, actorId: ActorId): Promise<EntityRef> {
		const result = await this.repo.softDelete(id, actorId)
		await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
		return result
	}

	async handleHardRemove(id: number): Promise<EntityRef> {
		const result = await this.repo.hardDelete(id)
		await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
		return result
	}

	/* ──────────────────── HANDLER: COSTING SIMULATION ──────────────────── */

	async handleCalculateCost(recipeId: number): Promise<RecipeCostSchema> {
		const recipe = await this.getById(recipeId)
		const items = recipe.items ?? []

		let totalCost = new Decimal(0)
		const detailedItems = []

		for (const item of items) {
			const avgCost = new Decimal(await this.repo.getAvgCostForMaterial(item.materialId))
			const qty = new Decimal(item.qty)
			const scrap = new Decimal(item.scrapPercentage)

			const scrapFactor = new Decimal(1).plus(scrap.div(100))
			const itemCost = qty.mul(scrapFactor).mul(avgCost)

			totalCost = totalCost.plus(itemCost)
			detailedItems.push({
				...item,
				unitCost: avgCost.toString(),
				extendedCost: itemCost.toString(),
			})
		}

		const targetQty = new Decimal(recipe.targetQty)
		const unitCost = targetQty.isPositive() ? totalCost.div(targetQty) : totalCost

		return {
			recipeId,
			targetQty: targetQty.toString(),
			totalCost: totalCost.toString(),
			unitCost: unitCost.toString(),
			items: detailedItems,
		}
	}
}

import { record } from '@elysiajs/opentelemetry'
import { ConflictError } from '@/core/http/errors'

import { bento } from '@/core/cache'
import { RecipeRepo } from '../repo'

import type {
	RecipeCostDto,
	RecipeCreateDto,
	RecipeDto,
	RecipeFilterDto,
	RecipeSelectDto,
	RecipeUpdateDto,
} from '../dto/recipe.dto'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
	targetMissing: () =>
		new ConflictError('Recipe must have exactly one target', 'RECIPE_MISSING_TARGET'),
	targetExists: () =>
		new ConflictError('A recipe already exists for this target', 'RECIPE_TARGET_ALREADY_EXISTS'),
}

const cache = bento.namespace('recipe')

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class RecipeService {
	private readonly repo = new RecipeRepo()

	/* ─── Public Reads ─────────────────────────────────────────────────────────*/

	async getById(id: number): Promise<RecipeDto> {
		return record('RecipeService.getById', async () => {
			return cache.getOrSet({
				key: `${id}`,
				factory: async () => {
					const recipe = await this.repo.getById(id)
					if (!recipe) throw new Error(`Recipe with ID ${id} not found`)
					return recipe
				},
			})
		})
	}

	async count(): Promise<number> {
		return record('RecipeService.count', async () => {
			return cache.getOrSet({
				key: 'count',
				factory: async () => this.repo.count(),
			})
		})
	}

	/* ─── Public Handlers ──────────────────────────────────────────────────────*/

	async handleList(
		filter: RecipeFilterDto,
		pq: PaginationQuery,
	): Promise<WithPaginationResult<RecipeSelectDto>> {
		return record('RecipeService.handleList', async () => {
			return this.repo.getList(filter, pq)
		})
	}

	async handleDetail(id: number): Promise<RecipeSelectDto> {
		return record('RecipeService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	async handleCreate(data: RecipeCreateDto, actorId: number): Promise<{ id: number }> {
		return record('RecipeService.handleCreate', async () => {
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

			const created = await this.repo.create(data, actorId)
			await this.clearCache()
			return created
		})
	}

	async handleUpdate(data: RecipeUpdateDto, actorId: number): Promise<{ id: number }> {
		return record('RecipeService.handleUpdate', async () => {
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

			const updated = await this.repo.update(data, actorId)
			await this.clearCache(data.id)
			return updated
		})
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('RecipeService.handleRemove', async () => {
			const result = await this.repo.softDelete(id, actorId)
			await this.clearCache(id)
			return result
		})
	}

	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('RecipeService.handleHardRemove', async () => {
			const result = await this.repo.hardDelete(id)
			await this.clearCache(id)
			return result
		})
	}

	/* ──────────────────── HANDLER: COSTING SIMULATION ──────────────────── */

	async handleCalculateCost(recipeId: number): Promise<RecipeCostDto> {
		return record('RecipeService.handleCalculateCost', async () => {
			const recipe = await this.getById(recipeId)
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
				detailedItems.push({ ...item, unitCost: avgCost, extendedCost: itemCost })
			}

			const targetQty = Number(recipe.targetQty)
			const unitCost = targetQty > 0 ? totalCost / targetQty : totalCost

			return { recipeId, targetQty, totalCost, unitCost, items: detailedItems }
		})
	}

	private async clearCache(id?: number) {
		const keys = ['count', 'list']
		if (id) keys.push(`${id}`)
		await cache.deleteMany({ keys })
	}
}

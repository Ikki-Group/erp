import { record } from '@elysiajs/opentelemetry'
import Decimal from 'decimal.js'

import { ConflictError, NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import type {
	RecipeCostDto,
	RecipeCreateDto,
	RecipeDto,
	RecipeFilterDto,
	RecipeSelectDto,
	RecipeUpdateDto,
} from '../dto/recipe.dto'
import { RecipeRepo } from '../repo'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
	notFound: (id: number) => new NotFoundError(`Recipe with ID ${id} not found`, 'RECIPE_NOT_FOUND'),
	targetMissing: () =>
		new ConflictError('Recipe must have exactly one target', 'RECIPE_MISSING_TARGET'),
	targetExists: () =>
		new ConflictError('A recipe already exists for this target', 'RECIPE_TARGET_ALREADY_EXISTS'),
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class RecipeService {
	constructor(private readonly repo = new RecipeRepo()) {}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<RecipeDto> {
		return record('RecipeService.getById', async () => {
			const recipe = await this.repo.getById(id)
			if (!recipe) throw err.notFound(id)
			return recipe
		})
	}

	async count(): Promise<number> {
		return record('RecipeService.count', async () => {
			return this.repo.count()
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: RecipeFilterDto): Promise<WithPaginationResult<RecipeSelectDto>> {
		return record('RecipeService.handleList', async () => {
			return this.repo.getListPaginated(filter)
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

			return this.repo.create(data, actorId)
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

			return this.repo.update(data, actorId)
		})
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('RecipeService.handleRemove', async () => {
			return this.repo.softDelete(id, actorId)
		})
	}

	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('RecipeService.handleHardRemove', async () => {
			return this.repo.hardDelete(id)
		})
	}

	/* ──────────────────── HANDLER: COSTING SIMULATION ──────────────────── */

	async handleCalculateCost(recipeId: number): Promise<RecipeCostDto> {
		return record('RecipeService.handleCalculateCost', async () => {
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
		})
	}
}

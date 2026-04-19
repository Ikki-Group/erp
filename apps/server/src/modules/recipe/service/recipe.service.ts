import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, inArray, isNull, ne, sql } from 'drizzle-orm'

import { bento } from '@/core/cache'
import { paginate, sortBy, stampCreate, stampUpdate, takeFirstOrThrow } from '@/core/database'
import { ConflictError, NotFoundError } from '@/core/http/errors'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'

import { db } from '@/db'
import {
	materialLocationsTable,
	materialsTable,
	recipeItemsTable,
	recipesTable,
	uomsTable,
} from '@/db/schema'

import type {
	RecipeCostDto,
	RecipeCreateDto,
	RecipeDto,
	RecipeFilterDto,
	RecipeSelectDto,
	RecipeUpdateDto,
} from '../dto/recipe.dto'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
	notFound: (id: number) => new NotFoundError(`Recipe with ID ${id} not found`, 'RECIPE_NOT_FOUND'),
}

const cache = bento.namespace('recipe')

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class RecipeService {
	// ─── Private Helpers ──────────────────────────────────────────────────────

	private async getRecipeItems(recipeId: number) {
		const results = await db
			.select({
				item: recipeItemsTable,
				material: { name: materialsTable.name, sku: materialsTable.sku },
				uom: { code: uomsTable.code },
			})
			.from(recipeItemsTable)
			.innerJoin(materialsTable, eq(recipeItemsTable.materialId, materialsTable.id))
			.innerJoin(uomsTable, eq(recipeItemsTable.uomId, uomsTable.id))
			.where(and(eq(recipeItemsTable.recipeId, recipeId), isNull(recipeItemsTable.deletedAt)))
			.orderBy(recipeItemsTable.sortOrder)

		return results.map((r) =>
			Object.assign({}, r.item, {
				material: r.material,
				uom: r.uom,
				qty: Number(r.item.qty),
				scrapPercentage: Number(r.item.scrapPercentage),
				sortOrder: Number(r.item.sortOrder),
			}),
		)
	}

	// ─── Public Reads ─────────────────────────────────────────────────────────

	/**
	 * Finds a single recipe by ID. Throws if not found.
	 */
	async getById(id: number): Promise<RecipeDto> {
		return record('RecipeService.getById', async () => {
			return cache.getOrSet({
				key: `${id}`,
				factory: async () => {
					const result = await db
						.select()
						.from(recipesTable)
						.where(and(eq(recipesTable.id, id), isNull(recipesTable.deletedAt)))
					const recipe = takeFirstOrThrow(
						result,
						`Recipe with ID ${id} not found`,
						'RECIPE_NOT_FOUND',
					)

					const items = await this.getRecipeItems(id)

					return {
						...recipe,
						targetQty: Number(recipe.targetQty),
						items,
					}
				},
			})
		})
	}

	async count(): Promise<number> {
		return record('RecipeService.count', async () => {
			return cache.getOrSet({
				key: 'count',
				factory: async () => {
					const result = await db
						.select({ val: count() })
						.from(recipesTable)
						.where(isNull(recipesTable.deletedAt))
					return result[0]?.val ?? 0
				},
			})
		})
	}

	// ─── Public Handlers ──────────────────────────────────────────────────────

	async handleList(
		filter: RecipeFilterDto,
		pq: PaginationQuery,
	): Promise<WithPaginationResult<RecipeSelectDto>> {
		return record('RecipeService.handleList', async () => {
			const { materialId, productId, productVariantId, isActive } = filter

			const where = and(
				isNull(recipesTable.deletedAt),
				materialId === undefined ? undefined : eq(recipesTable.materialId, materialId),
				productId === undefined ? undefined : eq(recipesTable.productId, productId),
				productVariantId === undefined
					? undefined
					: eq(recipesTable.productVariantId, productVariantId),
				isActive === undefined ? undefined : eq(recipesTable.isActive, isActive),
			)

			const result = await paginate({
				data: ({ limit, offset }) =>
					db
						.select()
						.from(recipesTable)
						.where(where)
						.orderBy(sortBy(recipesTable.updatedAt, 'desc'))
						.limit(limit)
						.offset(offset),
				pq,
				countQuery: db.select({ count: count() }).from(recipesTable).where(where),
			})

			const recipeIds = result.data.map((r) => r.id)

			const allItemsRaw =
				recipeIds.length > 0
					? await db
							.select({
								item: recipeItemsTable,
								material: { name: materialsTable.name, sku: materialsTable.sku },
								uom: { code: uomsTable.code },
							})
							.from(recipeItemsTable)
							.innerJoin(materialsTable, eq(recipeItemsTable.materialId, materialsTable.id))
							.innerJoin(uomsTable, eq(recipeItemsTable.uomId, uomsTable.id))
							.where(
								and(
									inArray(recipeItemsTable.recipeId, recipeIds),
									isNull(recipeItemsTable.deletedAt),
								),
							)
							.orderBy(recipeItemsTable.sortOrder)
					: []

			const allItems = allItemsRaw.map((r) =>
				Object.assign({}, r.item, {
					material: r.material,
					uom: r.uom,
					qty: Number(r.item.qty),
					scrapPercentage: Number(r.item.scrapPercentage),
					sortOrder: Number(r.item.sortOrder),
				}),
			)

			const itemsByRecipe = new Map<number, typeof allItems>()
			for (const item of allItems) {
				const list = itemsByRecipe.get(item.recipeId) || []
				list.push(item)
				itemsByRecipe.set(item.recipeId, list)
			}

			const data: RecipeSelectDto[] = result.data.map((r) => ({
				...r,
				targetQty: Number(r.targetQty),
				items: itemsByRecipe.get(r.id) || [],
			}))

			return { data, meta: result.meta }
		})
	}

	async handleDetail(id: number): Promise<RecipeSelectDto> {
		return record('RecipeService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	private async checkTargetConflict(
		target: {
			materialId?: number | null | undefined
			productId?: number | null | undefined
			productVariantId?: number | null | undefined
		},
		excludeId?: number,
	) {
		const conditions = [isNull(recipesTable.deletedAt)]

		if (target.materialId) conditions.push(eq(recipesTable.materialId, target.materialId))
		if (target.productId) conditions.push(eq(recipesTable.productId, target.productId))
		if (target.productVariantId)
			conditions.push(eq(recipesTable.productVariantId, target.productVariantId))

		if (conditions.length !== 2) {
			// 1 for deletedAt, 1 for the target
			throw new ConflictError('Recipe must have exactly one target', 'RECIPE_MISSING_TARGET')
		}

		if (excludeId) {
			conditions.push(ne(recipesTable.id, excludeId))
		}

		const [conflict] = await db
			.select({ id: recipesTable.id })
			.from(recipesTable)
			.where(and(...conditions))
			.limit(1)

		if (conflict) {
			throw new ConflictError(
				'A recipe already exists for this target',
				'RECIPE_TARGET_ALREADY_EXISTS',
			)
		}
	}

	async handleCreate(data: RecipeCreateDto, actorId: number): Promise<{ id: number }> {
		return record('RecipeService.handleCreate', async () => {
			await this.checkTargetConflict({
				materialId: data.materialId,
				productId: data.productId,
				productVariantId: data.productVariantId,
			})

			const meta = stampCreate(actorId)

			const inserted = await db.transaction(async (tx) => {
				const [recipe] = await tx
					.insert(recipesTable)
					.values({
						materialId: data.materialId ?? null,
						productId: data.productId ?? null,
						productVariantId: data.productVariantId ?? null,
						targetQty: (data.targetQty ?? 1).toString(),
						isActive: data.isActive,
						instructions: data.instructions,
						...meta,
					})
					.returning({ id: recipesTable.id })

				if (!recipe) throw new Error('Failed to create recipe')

				if (data.items?.length) {
					await tx.insert(recipeItemsTable).values(
						data.items.map((item) => ({
							recipeId: recipe.id,
							materialId: item.materialId,
							qty: item.qty.toString(),
							scrapPercentage: item.scrapPercentage?.toString() ?? '0',
							uomId: item.uomId,
							notes: item.notes,
							sortOrder: (item.sortOrder ?? 0).toString(),
							...meta,
						})),
					)
				}

				return recipe
			})

			await this.clearCache()
			return inserted
		})
	}

	async handleUpdate(
		data: RecipeUpdateDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('RecipeService.handleUpdate', async () => {
			const { id } = data
			const existing = await this.getById(id)

			const target = {
				materialId: data.materialId === undefined ? existing.materialId : data.materialId,
				productId: data.productId === undefined ? existing.productId : data.productId,
				productVariantId:
					data.productVariantId === undefined ? existing.productVariantId : data.productVariantId,
			}

			await this.checkTargetConflict(target, id)

			const updateMeta = stampUpdate(actorId)
			const createMeta = stampCreate(actorId)

			const updated = await db.transaction(async (tx) => {
				await tx
					.update(recipesTable)
					.set({
						materialId: data.materialId === undefined ? existing.materialId : data.materialId,
						productId: data.productId === undefined ? existing.productId : data.productId,
						productVariantId:
							data.productVariantId === undefined
								? existing.productVariantId
								: data.productVariantId,
						targetQty: (data.targetQty ?? existing.targetQty).toString(),
						isActive: data.isActive ?? existing.isActive,
						instructions:
							data.instructions === undefined ? existing.instructions : data.instructions,
						...updateMeta,
					})
					.where(and(eq(recipesTable.id, id), isNull(recipesTable.deletedAt)))

				// Hard delete items before re-inserting is standard here as they don't have children
				await tx.delete(recipeItemsTable).where(eq(recipeItemsTable.recipeId, id))

				if (data.items?.length) {
					await tx.insert(recipeItemsTable).values(
						data.items.map((item) => ({
							recipeId: id,
							materialId: item.materialId,
							qty: item.qty.toString(),
							scrapPercentage: item.scrapPercentage?.toString() ?? '0',
							uomId: item.uomId,
							notes: item.notes ?? null,
							sortOrder: (item.sortOrder ?? 0).toString(),
							...createMeta,
						})),
					)
				}

				return { id }
			})

			await this.clearCache(id)
			return updated
		})
	}

	/**
	 * Marks a recipe as deleted (Soft Delete).
	 */
	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('RecipeService.handleRemove', async () => {
			const result = await db.transaction(async (tx) => {
				const timestamp = new Date()

				// Also soft delete items
				await tx
					.update(recipeItemsTable)
					.set({ deletedAt: timestamp, deletedBy: actorId })
					.where(eq(recipeItemsTable.recipeId, id))

				return tx
					.update(recipesTable)
					.set({ deletedAt: timestamp, deletedBy: actorId })
					.where(eq(recipesTable.id, id))
					.returning({ id: recipesTable.id })
			})

			if (result.length === 0) throw err.notFound(id)

			await this.clearCache(id)
			return { id }
		})
	}

	/**
	 * Permanently deletes a recipe (Hard Delete).
	 */
	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('RecipeService.handleHardRemove', async () => {
			const result = await db
				.delete(recipesTable)
				.where(eq(recipesTable.id, id))
				.returning({ id: recipesTable.id })
			if (result.length === 0) throw err.notFound(id)

			await this.clearCache(id)
			return { id }
		})
	}

	private async clearCache(id?: number) {
		const keys = ['count', 'list']
		if (id) keys.push(`${id}`)
		await cache.deleteMany({ keys })
	}

	/* ──────────────────── HANDLER: COSTING SIMULATION ──────────────────── */

	/**
	 * Calculates the estimated cost of a product variant based on its recipe.
	 * TotalCost = sum(item.qty * (1 + item.scrapPercentage/100) * material.avgCost)
	 */
	async handleCalculateCost(recipeId: number): Promise<RecipeCostDto> {
		return record('RecipeService.handleCalculateCost', async () => {
			const recipe = await this.getById(recipeId)
			const items = recipe.items || []

			let totalCost = 0
			const detailedItems = []

			for (const item of items) {
				// Query average cost for this material across all locations
				// We use COALESCE(AVG(...), 0) to handle materials with no stock/cost history
				const [valuation] = await db
					.select({ avgCost: sql<string>`COALESCE(AVG("currentAvgCost"), 0)` })
					.from(materialLocationsTable)
					.where(
						and(
							eq(materialLocationsTable.materialId, item.materialId),
							isNull(materialLocationsTable.deletedAt),
						),
					)

				const avgCost = Number(valuation?.avgCost || 0)
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
}

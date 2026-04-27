import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, inArray, isNull, ne, sql } from 'drizzle-orm'
import { z } from 'zod'

import { bento, CACHE_KEY_DEFAULT } from '@/core/cache'
import {
	paginate,
	sortBy,
	stampCreate,
	stampUpdate,
	type WithPaginationResult,
} from '@/core/database'

import { db } from '@/db'
import {
	materialLocationsTable,
	materialsTable,
	recipeItemsTable,
	recipesTable,
	uomsTable,
} from '@/db/schema'

import type {
	RecipeCreateDto,
	RecipeDto,
	RecipeFilterDto,
	RecipeSelectDto,
	RecipeUpdateDto,
} from './recipe.dto'

const cache = bento.namespace('recipe')

export class RecipeRepo {
	/* -------------------------------- INTERNAL -------------------------------- */

	async #clearCache(id?: number): Promise<void> {
		return record('RecipeRepo.#clearCache', async () => {
			const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
			if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
			await cache.deleteMany({ keys })
		})
	}

	async #getRecipeItems(recipeId: number) {
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
				qty: r.item.qty,
				scrapPercentage: r.item.scrapPercentage,
				sortOrder: Number(r.item.sortOrder),
			}),
		)
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<RecipeDto | undefined> {
		return record('RecipeRepo.getById', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const [recipe] = await db
						.select()
						.from(recipesTable)
						.where(and(eq(recipesTable.id, id), isNull(recipesTable.deletedAt)))

					if (!recipe) return skip()

					const items = await this.#getRecipeItems(id)

					return {
						...recipe,
						targetQty: recipe.targetQty,
						items: items as any,
					}
				},
			})
		})
	}

	async count(): Promise<number> {
		return record('RecipeRepo.count', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.count,
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

	async getListPaginated(filter: RecipeFilterDto): Promise<WithPaginationResult<RecipeSelectDto>> {
		return record('RecipeRepo.getListPaginated', async () => {
			const { materialId, productId, productVariantId, isActive, page, limit } = filter

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
				data: ({ limit: l, offset }) =>
					db
						.select()
						.from(recipesTable)
						.where(where)
						.orderBy(sortBy(recipesTable.updatedAt, 'desc'))
						.limit(l)
						.offset(offset),
				pq: { page, limit },
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
								)
							)
							.orderBy(recipeItemsTable.sortOrder)
					: []

			const allItems = allItemsRaw.map((r) =>
				Object.assign({}, r.item, {
					material: r.material,
					uom: r.uom,
					qty: r.item.qty,
					scrapPercentage: r.item.scrapPercentage,
					sortOrder: Number(r.item.sortOrder),
				}),
			)

			const itemsByRecipe = new Map<number, typeof allItems>()
			for (const item of allItems) {
				const list = itemsByRecipe.get(item.recipeId) ?? []
				list.push(item)
				itemsByRecipe.set(item.recipeId, list)
			}

			const data: RecipeSelectDto[] = result.data.map((r) => ({
				...r,
				targetQty: r.targetQty,
				items: (itemsByRecipe.get(r.id) as any) ?? [],
			}))

			return { data, meta: result.meta }
		})
	}

	async getAvgCostForMaterial(materialId: number): Promise<number> {
		return record('RecipeRepo.getAvgCostForMaterial', async () => {
			const [valuation] = await db
				.select({ avgCost: sql<string>`COALESCE(AVG("currentAvgCost"), 0)` })
				.from(materialLocationsTable)
				.where(
					and(
						eq(materialLocationsTable.materialId, materialId),
						isNull(materialLocationsTable.deletedAt),
					),
				)

			return Number(valuation?.avgCost ?? 0)
		})
	}

	async checkTargetConflict(
		target: {
			materialId?: number | null | undefined
			productId?: number | null | undefined
			productVariantId?: number | null | undefined
		},
		excludeId?: number,
	): Promise<boolean> {
		return record('RecipeRepo.checkTargetConflict', async () => {
			const conditions = [isNull(recipesTable.deletedAt)]

			if (target.materialId) conditions.push(eq(recipesTable.materialId, target.materialId))
			if (target.productId) conditions.push(eq(recipesTable.productId, target.productId))
			if (target.productVariantId)
				conditions.push(eq(recipesTable.productVariantId, target.productVariantId))

			if (conditions.length !== 2) {
				return false // Invalid target
			}

			if (excludeId) {
				conditions.push(ne(recipesTable.id, excludeId))
			}

			const [conflict] = await db
				.select({ id: recipesTable.id })
				.from(recipesTable)
				.where(and(...conditions))
				.limit(1)

			return !!conflict
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: RecipeCreateDto, actorId: number): Promise<{ id: number }> {
		return record('RecipeRepo.create', async () => {
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

				return recipe as any
			})

			void this.#clearCache()
			return inserted
		})
	}

	async update(data: RecipeUpdateDto, actorId: number): Promise<{ id: number }> {
		return record('RecipeRepo.update', async () => {
			const { id } = data
			const existing = await this.getById(id)
			if (!existing) throw new Error(`Recipe with ID ${id} not found`)

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

				// Hard delete items before re-inserting
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

			void this.#clearCache(id)
			return updated
		})
	}

	async softDelete(id: number, actorId: number): Promise<{ id: number }> {
		return record('RecipeRepo.softDelete', async () => {
			await db.transaction(async (tx) => {
				const timestamp = new Date()

				// Also soft delete items
				await tx
					.update(recipeItemsTable)
					.set({ deletedAt: timestamp, deletedBy: actorId })
					.where(eq(recipeItemsTable.recipeId, id))

				await tx
					.update(recipesTable)
					.set({ deletedAt: timestamp, deletedBy: actorId })
					.where(eq(recipesTable.id, id))
			})

			void this.#clearCache(id)
			return { id }
		})
	}

	async hardDelete(id: number): Promise<{ id: number }> {
		return record('RecipeRepo.hardDelete', async () => {
			const result = await db
				.delete(recipesTable)
				.where(eq(recipesTable.id, id))
				.returning({ id: recipesTable.id })

			if (result.length === 0) throw new Error(`Recipe with ID ${id} not found`)
			return z.object({ id: z.number() }).parse(result[0])
		})
	}
}

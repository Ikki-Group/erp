import { and, count, eq, inArray, isNull, sql } from 'drizzle-orm'

import type { DbContext } from '@/infra/database'
import { paginate, sortBy } from '@/infra/database'
import {
	materialLocationsTable,
	materialsTable,
	recipeItemsTable,
	recipesTable,
	uomsTable,
} from '@/db/schema'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type { RecipeDto, RecipeFilterDto } from './recipe.contract'

type RecipeInsert = typeof recipesTable.$inferInsert

export interface RecipeItemInput {
	materialId: number
	qty: string
	scrapPercentage: string
	uomId: number
	notes: string | null
	sortOrder: number
	createdBy: number
	updatedBy: number
	createdAt: Date
	updatedAt: Date
}

export interface IRecipeRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<RecipeDto | undefined>
	findPage(filter: RecipeFilterDto, db?: DbContext): Promise<WithPaginationResult<RecipeDto>>
	findManyByMaterialId(materialId: number, db?: DbContext): Promise<RecipeDto[]>
	count(db?: DbContext): Promise<number>
	insert(data: RecipeInsert, items: RecipeItemInput[], db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: Partial<RecipeInsert>, items: RecipeItemInput[], db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, deletedBy: ActorId, db?: DbContext): Promise<EntityRef | undefined>
	getAvgCostForMaterial(materialId: number, db?: DbContext): Promise<number>
}

export class RecipeRepo implements IRecipeRepo {
	constructor(readonly db: DbContext) {}

	async #getRecipeItems(recipeId: number, db: DbContext) {
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

		return results.map((r) => ({
			...r.item,
			material: r.material,
			uom: r.uom,
			qty: r.item.qty,
			scrapPercentage: r.item.scrapPercentage,
			sortOrder: Number(r.item.sortOrder),
		}))
	}

	async findById(id: number, db: DbContext = this.db): Promise<RecipeDto | undefined> {
		const [recipe] = await db
			.select()
			.from(recipesTable)
			.where(and(eq(recipesTable.id, id), isNull(recipesTable.deletedAt)))
			.limit(1)

		if (!recipe) return undefined

		const items = await this.#getRecipeItems(id, db)

		return {
			...recipe,
			targetQty: recipe.targetQty,
			items,
		}
	}

	async findPage(
		filter: RecipeFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<RecipeDto>> {
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
			countQuery: () => db.select({ count: count() }).from(recipesTable).where(where),
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

		const allItems = allItemsRaw.map((r) => ({
			...r.item,
			material: r.material,
			uom: r.uom,
			qty: r.item.qty,
			scrapPercentage: r.item.scrapPercentage,
			sortOrder: Number(r.item.sortOrder),
		}))

		const itemsByRecipe = new Map<number, typeof allItems>()
		for (const item of allItems) {
			const list = itemsByRecipe.get(item.recipeId) ?? []
			list.push(item)
			itemsByRecipe.set(item.recipeId, list)
		}

		const data = result.data.map((r) => ({
			...r,
			targetQty: r.targetQty,
			items: itemsByRecipe.get(r.id) ?? [],
		}))

		return { data, meta: result.meta }
	}

	async findManyByMaterialId(materialId: number, db: DbContext = this.db): Promise<RecipeDto[]> {
		return db
			.select()
			.from(recipesTable)
			.where(and(eq(recipesTable.materialId, materialId), isNull(recipesTable.deletedAt)))
	}

	async count(db: DbContext = this.db): Promise<number> {
		const result = await db
			.select({ val: count() })
			.from(recipesTable)
			.where(isNull(recipesTable.deletedAt))
		return result[0]?.val ?? 0
	}

	async insert(
		data: RecipeInsert,
		items: RecipeItemInput[],
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [recipe] = await db
			.insert(recipesTable)
			.values(data)
			.returning({ id: recipesTable.id })

		if (!recipe) return undefined

		if (items.length > 0) {
			await db.insert(recipeItemsTable).values(
				items.map((item) => ({
					...item,
					recipeId: recipe.id,
				})),
			)
		}

		return { id: recipe.id }
	}

	async update(
		id: number,
		data: Partial<RecipeInsert>,
		items: RecipeItemInput[],
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		await db
			.update(recipesTable)
			.set(data)
			.where(and(eq(recipesTable.id, id), isNull(recipesTable.deletedAt)))

		await db.delete(recipeItemsTable).where(eq(recipeItemsTable.recipeId, id))

		if (items.length > 0) {
			await db.insert(recipeItemsTable).values(
				items.map((item) => ({
					...item,
					recipeId: id,
				})),
			)
		}

		return { id }
	}

	async remove(id: number, deletedBy: ActorId, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const timestamp = new Date()

		await db
			.update(recipeItemsTable)
			.set({ deletedAt: timestamp, deletedBy })
			.where(eq(recipeItemsTable.recipeId, id))

		const [result] = await db
			.update(recipesTable)
			.set({ deletedAt: timestamp, deletedBy })
			.where(eq(recipesTable.id, id))
			.returning({ id: recipesTable.id })

		return result
	}

	async getAvgCostForMaterial(materialId: number, db: DbContext = this.db): Promise<number> {
		const [valuation] = await db
			.select({ avgCost: sql<string>`COALESCE(AVG("currentAvgCost"), 0)` })
			.from(materialLocationsTable)
			.where(eq(materialLocationsTable.materialId, materialId))

		return Number(valuation?.avgCost ?? 0)
	}
}

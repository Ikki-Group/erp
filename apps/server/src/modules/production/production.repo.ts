import { productionOrders, productionRecipeLines, productionRecipes } from '@/db/schema/production.ts'

import {
	allOf,
	eq,
	eqIf,
	sql,
	takeFirst,
	toLimitOffset,
	buildPaginationMeta,
} from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type {
	ProductionOrderDto,
	ProductionOrderDetailDto,
	ProductionOrderFilterDto,
	ProductionOrderStatusEnum,
	ProductionRecipeDetailDto,
	ProductionRecipeDto,
	ProductionRecipeFilterDto,
	ProductionRecipeLineDto,
} from './production.contract.ts'

// ─── Types ───

type RecipeRow = typeof productionRecipes.$inferSelect
type RecipeInsert = typeof productionRecipes.$inferInsert
type RecipeLineRow = typeof productionRecipeLines.$inferSelect
type RecipeLineInsert = typeof productionRecipeLines.$inferInsert
type OrderRow = typeof productionOrders.$inferSelect
type OrderInsert = typeof productionOrders.$inferInsert

function toRecipeDto(row: RecipeRow): ProductionRecipeDto {
	return {
		id: row.id,
		materialId: row.materialId,
		name: row.name,
		yieldQty: row.yieldQty,
		yieldUomId: row.yieldUomId,
		isActive: row.isActive,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

function toRecipeLineDto(row: RecipeLineRow): ProductionRecipeLineDto {
	return {
		id: row.id,
		recipeId: row.recipeId,
		materialId: row.materialId,
		quantity: row.quantity,
		uomId: row.uomId,
	}
}

function toOrderDto(row: OrderRow): ProductionOrderDto {
	return {
		id: row.id,
		productionNo: row.productionNo,
		locationId: row.locationId,
		materialId: row.materialId,
		recipeId: row.recipeId,
		status: row.status,
		plannedQty: row.plannedQty,
		actualQty: row.actualQty,
		notes: row.notes,
		producedBy: row.producedBy,
		completedAt: row.completedAt,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

// ─── Interface ───

export interface IProductionRepo {
	readonly db: DbContext

	// Recipe
	findRecipeById(id: number, db?: DbContext): Promise<ProductionRecipeDto | undefined>
	findRecipeDetailById(id: number, db?: DbContext): Promise<ProductionRecipeDetailDto | undefined>
	findRecipePage(filter: ProductionRecipeFilterDto, db?: DbContext): Promise<WithPaginationResult<ProductionRecipeDto>>
	insertRecipe(data: RecipeInsert, db?: DbContext): Promise<EntityRef | undefined>
	updateRecipe(id: number, data: Partial<RecipeInsert>, db?: DbContext): Promise<EntityRef | undefined>
	removeRecipe(id: number, db?: DbContext): Promise<boolean>

	// Recipe Lines
	replaceRecipeLines(recipeId: number, lines: RecipeLineInsert[], db?: DbContext): Promise<void>
	findLinesByRecipeId(recipeId: number, db?: DbContext): Promise<ProductionRecipeLineDto[]>

	// Order
	findOrderById(id: number, db?: DbContext): Promise<ProductionOrderDto | undefined>
	findOrderDetailById(id: number, db?: DbContext): Promise<ProductionOrderDetailDto | undefined>
	findOrderPage(filter: ProductionOrderFilterDto, db?: DbContext): Promise<WithPaginationResult<ProductionOrderDto>>
	insertOrder(data: OrderInsert, db?: DbContext): Promise<EntityRef | undefined>
	updateOrderStatus(id: number, status: ProductionOrderStatusEnum, updatedBy: number, db?: DbContext): Promise<EntityRef | undefined>
	updateOrder(id: number, data: Partial<OrderInsert>, db?: DbContext): Promise<EntityRef | undefined>
}

// ─── Implementation ───

export class ProductionRepo implements IProductionRepo {
	constructor(readonly db: DbContext) {}

	// ─── Recipe ───

	async findRecipeById(id: number, db: DbContext = this.db): Promise<ProductionRecipeDto | undefined> {
		const row = await db
			.select()
			.from(productionRecipes)
			.where(eq(productionRecipes.id, id))
			.limit(1)
			.then(takeFirst)
		return row ? toRecipeDto(row) : undefined
	}

	async findRecipeDetailById(id: number, db: DbContext = this.db): Promise<ProductionRecipeDetailDto | undefined> {
		const recipe = await this.findRecipeById(id, db)
		if (!recipe) return undefined

		const lines = await this.findLinesByRecipeId(id, db)
		return { ...recipe, lines }
	}

	async findRecipePage(
		filter: ProductionRecipeFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<ProductionRecipeDto>> {
		const where = this.#buildRecipeWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: productionRecipes.id,
				materialId: productionRecipes.materialId,
				name: productionRecipes.name,
				yieldQty: productionRecipes.yieldQty,
				yieldUomId: productionRecipes.yieldUomId,
				isActive: productionRecipes.isActive,
				createdAt: productionRecipes.createdAt,
				updatedAt: productionRecipes.updatedAt,
				createdBy: productionRecipes.createdBy,
				updatedBy: productionRecipes.updatedBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(productionRecipes)
			.where(where)
			.orderBy(sql`${productionRecipes.createdAt} desc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toRecipeDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async insertRecipe(data: RecipeInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(productionRecipes)
			.values(data)
			.returning({ id: productionRecipes.id })
		return result
	}

	async updateRecipe(id: number, data: Partial<RecipeInsert>, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(productionRecipes)
			.set(data)
			.where(eq(productionRecipes.id, id))
			.returning({ id: productionRecipes.id })
		return result
	}

	async removeRecipe(id: number, db: DbContext = this.db): Promise<boolean> {
		const result = await db
			.delete(productionRecipes)
			.where(eq(productionRecipes.id, id))
			.returning({ id: productionRecipes.id })
		return result.length > 0
	}

	// ─── Recipe Lines ───

	async replaceRecipeLines(recipeId: number, lines: RecipeLineInsert[], db: DbContext = this.db): Promise<void> {
		await db.delete(productionRecipeLines).where(eq(productionRecipeLines.recipeId, recipeId))
		if (lines.length > 0) {
			await db.insert(productionRecipeLines).values(lines)
		}
	}

	async findLinesByRecipeId(recipeId: number, db: DbContext = this.db): Promise<ProductionRecipeLineDto[]> {
		const rows = await db
			.select()
			.from(productionRecipeLines)
			.where(eq(productionRecipeLines.recipeId, recipeId))
		return rows.map(toRecipeLineDto)
	}

	// ─── Order ───

	async findOrderById(id: number, db: DbContext = this.db): Promise<ProductionOrderDto | undefined> {
		const row = await db
			.select()
			.from(productionOrders)
			.where(eq(productionOrders.id, id))
			.limit(1)
			.then(takeFirst)
		return row ? toOrderDto(row) : undefined
	}

	async findOrderDetailById(id: number, db: DbContext = this.db): Promise<ProductionOrderDetailDto | undefined> {
		const order = await this.findOrderById(id, db)
		if (!order) return undefined

		const recipe = await this.findRecipeDetailById(order.recipeId, db)
		if (!recipe) return undefined

		return { ...order, recipe }
	}

	async findOrderPage(
		filter: ProductionOrderFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<ProductionOrderDto>> {
		const where = this.#buildOrderWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: productionOrders.id,
				productionNo: productionOrders.productionNo,
				locationId: productionOrders.locationId,
				materialId: productionOrders.materialId,
				recipeId: productionOrders.recipeId,
				status: productionOrders.status,
				plannedQty: productionOrders.plannedQty,
				actualQty: productionOrders.actualQty,
				notes: productionOrders.notes,
				producedBy: productionOrders.producedBy,
				completedAt: productionOrders.completedAt,
				createdAt: productionOrders.createdAt,
				updatedAt: productionOrders.updatedAt,
				createdBy: productionOrders.createdBy,
				updatedBy: productionOrders.updatedBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(productionOrders)
			.where(where)
			.orderBy(sql`${productionOrders.createdAt} desc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toOrderDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async insertOrder(data: OrderInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(productionOrders)
			.values(data)
			.returning({ id: productionOrders.id })
		return result
	}

	async updateOrderStatus(
		id: number,
		status: ProductionOrderStatusEnum,
		updatedBy: number,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(productionOrders)
			.set({ status, updatedBy, updatedAt: new Date() })
			.where(eq(productionOrders.id, id))
			.returning({ id: productionOrders.id })
		return result
	}

	async updateOrder(id: number, data: Partial<OrderInsert>, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(productionOrders)
			.set(data)
			.where(eq(productionOrders.id, id))
			.returning({ id: productionOrders.id })
		return result
	}

	// ─── Private ───

	#buildRecipeWhere(filter: ProductionRecipeFilterDto) {
		return allOf(
			eqIf(productionRecipes.materialId, filter.materialId),
			filter.q
				? sql`${productionRecipes.name} ilike ${'%' + filter.q + '%'}`
				: undefined,
		)
	}

	#buildOrderWhere(filter: ProductionOrderFilterDto) {
		return allOf(
			eqIf(productionOrders.locationId, filter.locationId),
			eqIf(productionOrders.status, filter.status),
			eqIf(productionOrders.materialId, filter.materialId),
		)
	}
}

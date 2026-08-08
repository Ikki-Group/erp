import { recipes, recipeLines } from '@/db/schema/recipe.ts'

import {
	and,
	eq,
	sql,
	takeFirst,
	toLimitOffset,
	buildPaginationMeta,
} from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { RecipeDto, RecipeFilterDto, RecipeLineDto } from './recipe.contract.ts'

// ─── Types ───

type RecipeInsert = typeof recipes.$inferInsert
type RecipeUpdate = Partial<Omit<RecipeInsert, 'id'>>
type RecipeLineInsert = typeof recipeLines.$inferInsert

interface RecipeRow {
	id: number
	menuItemId: number
	name: string
	yieldQty: string
	isActive: number
	createdAt: Date
	updatedAt: Date
	createdBy: number | null
	updatedBy: number | null
}

interface RecipeLineRow {
	id: number
	recipeId: number
	materialId: number
	quantity: string
	uomId: number
}

function toRecipeDto(row: RecipeRow): RecipeDto {
	return {
		id: row.id,
		menuItemId: row.menuItemId,
		name: row.name,
		yieldQty: row.yieldQty,
		isActive: row.isActive === 1,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

function toLineDto(row: RecipeLineRow): RecipeLineDto {
	return {
		id: row.id,
		recipeId: row.recipeId,
		materialId: row.materialId,
		quantity: row.quantity,
		uomId: row.uomId,
	}
}

// ─── Interface ───

export interface IRecipeRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<RecipeDto | undefined>
	findActiveByMenuItemId(menuItemId: number, db?: DbContext): Promise<RecipeDto | undefined>
	findPage(filter: RecipeFilterDto, db?: DbContext): Promise<WithPaginationResult<RecipeDto>>
	findLinesByRecipeId(recipeId: number, db?: DbContext): Promise<RecipeLineDto[]>
	insert(data: RecipeInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: RecipeUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
	deactivateByMenuItemId(menuItemId: number, db?: DbContext): Promise<void>
	replaceLines(
		recipeId: number,
		lines: Omit<RecipeLineInsert, 'recipeId'>[],
		db?: DbContext,
	): Promise<void>
}

// ─── Implementation ───

export class RecipeRepo implements IRecipeRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext = this.db): Promise<RecipeDto | undefined> {
		const row = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1).then(takeFirst)
		return row ? toRecipeDto(row) : undefined
	}

	async findActiveByMenuItemId(
		menuItemId: number,
		db: DbContext = this.db,
	): Promise<RecipeDto | undefined> {
		const row = await db
			.select()
			.from(recipes)
			.where(and(eq(recipes.menuItemId, menuItemId), eq(recipes.isActive, 1)))
			.limit(1)
			.then(takeFirst)
		return row ? toRecipeDto(row) : undefined
	}

	async findPage(
		filter: RecipeFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<RecipeDto>> {
		const { limit, offset } = toLimitOffset(filter)

		const conditions = filter.menuItemId ? eq(recipes.menuItemId, filter.menuItemId) : undefined

		const rows = await db
			.select({
				id: recipes.id,
				menuItemId: recipes.menuItemId,
				name: recipes.name,
				yieldQty: recipes.yieldQty,
				isActive: recipes.isActive,
				createdAt: recipes.createdAt,
				updatedAt: recipes.updatedAt,
				createdBy: recipes.createdBy,
				updatedBy: recipes.updatedBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(recipes)
			.where(conditions)
			.orderBy(sql`${recipes.id} desc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toRecipeDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async findLinesByRecipeId(recipeId: number, db: DbContext = this.db): Promise<RecipeLineDto[]> {
		const rows = await db.select().from(recipeLines).where(eq(recipeLines.recipeId, recipeId))
		return rows.map(toLineDto)
	}

	async insert(data: RecipeInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db.insert(recipes).values(data).returning({ id: recipes.id })
		return result
	}

	async update(
		id: number,
		data: RecipeUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(recipes)
			.set(data)
			.where(eq(recipes.id, id))
			.returning({ id: recipes.id })
		return result
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.delete(recipes)
			.where(eq(recipes.id, id))
			.returning({ id: recipes.id })
		return result
	}

	async deactivateByMenuItemId(menuItemId: number, db: DbContext = this.db): Promise<void> {
		await db.update(recipes).set({ isActive: 0 }).where(eq(recipes.menuItemId, menuItemId))
	}

	async replaceLines(
		recipeId: number,
		lines: Omit<RecipeLineInsert, 'recipeId'>[],
		db: DbContext = this.db,
	): Promise<void> {
		// Delete existing lines
		await db.delete(recipeLines).where(eq(recipeLines.recipeId, recipeId))

		// Insert new lines
		if (lines.length > 0) {
			const insertData = lines.map((line) => ({ ...line, recipeId }))
			await db.insert(recipeLines).values(insertData)
		}
	}
}

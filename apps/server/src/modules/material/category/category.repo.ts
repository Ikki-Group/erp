import { materialCategories } from '@/db/schema/material.ts'

import {
	allOf,
	eq,
	inArray,
	searchAcross,
	sql,
	takeFirst,
	toLimitOffset,
	buildPaginationMeta,
} from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { MaterialCategoryDto, MaterialCategoryFilterDto } from './category.contract.ts'

// ─── Types ───

type CategoryInsert = typeof materialCategories.$inferInsert
type CategoryUpdate = Partial<Omit<CategoryInsert, 'id'>>
type CategoryRow = typeof materialCategories.$inferSelect

function toDto(row: CategoryRow): MaterialCategoryDto {
	return {
		id: row.id,
		name: row.name,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

// ─── Interface ───

export interface ICategoryRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<MaterialCategoryDto | undefined>
	findByIds(ids: number[], db?: DbContext): Promise<MaterialCategoryDto[]>
	findMany(db?: DbContext): Promise<MaterialCategoryDto[]>
	findPage(filter: MaterialCategoryFilterDto, db?: DbContext): Promise<WithPaginationResult<MaterialCategoryDto>>
	insert(data: CategoryInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: CategoryUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

// ─── Implementation ───

export class CategoryRepo implements ICategoryRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext = this.db): Promise<MaterialCategoryDto | undefined> {
		const row = await db
			.select()
			.from(materialCategories)
			.where(eq(materialCategories.id, id))
			.limit(1)
			.then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async findByIds(ids: number[], db: DbContext = this.db): Promise<MaterialCategoryDto[]> {
		if (ids.length === 0) return []
		const rows = await db.select().from(materialCategories).where(inArray(materialCategories.id, ids))
		return rows.map(toDto)
	}

	async findMany(db: DbContext = this.db): Promise<MaterialCategoryDto[]> {
		const rows = await db.select().from(materialCategories)
		return rows.map(toDto)
	}

	async findPage(
		filter: MaterialCategoryFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<MaterialCategoryDto>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: materialCategories.id,
				name: materialCategories.name,
				createdAt: materialCategories.createdAt,
				updatedAt: materialCategories.updatedAt,
				createdBy: materialCategories.createdBy,
				updatedBy: materialCategories.updatedBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(materialCategories)
			.where(where)
			.orderBy(sql`${materialCategories.id} desc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async insert(data: CategoryInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(materialCategories)
			.values(data)
			.returning({ id: materialCategories.id })
		return result
	}

	async update(id: number, data: CategoryUpdate, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(materialCategories)
			.set(data)
			.where(eq(materialCategories.id, id))
			.returning({ id: materialCategories.id })
		return result
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.delete(materialCategories)
			.where(eq(materialCategories.id, id))
			.returning({ id: materialCategories.id })
		return result
	}

	// ─── Private ───

	#buildWhere(filter: MaterialCategoryFilterDto) {
		return allOf(
			searchAcross(filter.q, [materialCategories.name]),
		)
	}
}

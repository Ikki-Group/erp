import { materialCategories } from '@/db/schema/material.ts'

import {
	allOf,
	eq,
	searchAcross,
	sql,
	takeFirst,
	toLimitOffset,
	buildPaginationMeta,
} from '@/infra/database/index.ts'
import type { Db, DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { MaterialCategoryDto, MaterialCategoryFilterDto } from '@ikki/contract/material/category'

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

// ─── Implementation ───

export class CategoryRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: Db = this.db): Promise<MaterialCategoryDto | undefined> {
		const row = await db
			.select()
			.from(materialCategories)
			.where(eq(materialCategories.id, id))
			.limit(1)
			.then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async findPage(
		filter: MaterialCategoryFilterDto,
		db: Db = this.db,
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

	async insert(data: CategoryInsert, db: Db = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(materialCategories)
			.values(data)
			.returning({ id: materialCategories.id })
		return result
	}

	async update(id: number, data: CategoryUpdate, db: Db = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(materialCategories)
			.set(data)
			.where(eq(materialCategories.id, id))
			.returning({ id: materialCategories.id })
		return result
	}

	async remove(id: number, db: Db = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.delete(materialCategories)
			.where(eq(materialCategories.id, id))
			.returning({ id: materialCategories.id })
		return result
	}

	// ─── Private ───

	#buildWhere(filter: MaterialCategoryFilterDto) {
		return allOf(searchAcross(filter.q, [materialCategories.name]))
	}
}

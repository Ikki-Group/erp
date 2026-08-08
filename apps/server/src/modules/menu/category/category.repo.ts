import { menuCategories } from '@/db/schema/menu.ts'

import {
	allOf,
	eq,
	searchAcross,
	sql,
	takeFirst,
	toLimitOffset,
	buildPaginationMeta,
} from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { MenuCategoryDto, MenuCategoryFilterDto } from './category.contract.ts'

// ─── Types ───

type CategoryInsert = typeof menuCategories.$inferInsert
type CategoryUpdate = Partial<Omit<CategoryInsert, 'id'>>
type CategoryRow = typeof menuCategories.$inferSelect

function toDto(row: CategoryRow): MenuCategoryDto {
	return {
		id: row.id,
		locationId: row.locationId,
		name: row.name,
		parentId: row.parentId,
		sortOrder: row.sortOrder,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

// ─── Interface ───

export interface ICategoryRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<MenuCategoryDto | undefined>
	findByLocation(locationId: number, db?: DbContext): Promise<MenuCategoryDto[]>
	findPage(filter: MenuCategoryFilterDto, db?: DbContext): Promise<WithPaginationResult<MenuCategoryDto>>
	insert(data: CategoryInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: CategoryUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

// ─── Implementation ───

export class CategoryRepo implements ICategoryRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext = this.db): Promise<MenuCategoryDto | undefined> {
		const row = await db
			.select()
			.from(menuCategories)
			.where(eq(menuCategories.id, id))
			.limit(1)
			.then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async findByLocation(locationId: number, db: DbContext = this.db): Promise<MenuCategoryDto[]> {
		const rows = await db
			.select()
			.from(menuCategories)
			.where(eq(menuCategories.locationId, locationId))
			.orderBy(sql`${menuCategories.sortOrder} asc, ${menuCategories.id} asc`)
		return rows.map(toDto)
	}

	async findPage(
		filter: MenuCategoryFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<MenuCategoryDto>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: menuCategories.id,
				locationId: menuCategories.locationId,
				name: menuCategories.name,
				parentId: menuCategories.parentId,
				sortOrder: menuCategories.sortOrder,
				createdAt: menuCategories.createdAt,
				updatedAt: menuCategories.updatedAt,
				createdBy: menuCategories.createdBy,
				updatedBy: menuCategories.updatedBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(menuCategories)
			.where(where)
			.orderBy(sql`${menuCategories.sortOrder} asc, ${menuCategories.id} asc`)
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
			.insert(menuCategories)
			.values(data)
			.returning({ id: menuCategories.id })
		return result
	}

	async update(id: number, data: CategoryUpdate, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(menuCategories)
			.set(data)
			.where(eq(menuCategories.id, id))
			.returning({ id: menuCategories.id })
		return result
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.delete(menuCategories)
			.where(eq(menuCategories.id, id))
			.returning({ id: menuCategories.id })
		return result
	}

	// ─── Private ───

	#buildWhere(filter: MenuCategoryFilterDto) {
		return allOf(
			eq(menuCategories.locationId, filter.locationId),
			searchAcross(filter.q, [menuCategories.name]),
		)
	}
}

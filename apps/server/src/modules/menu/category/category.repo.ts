import { menuCategories } from '@/db/schema/menu.ts'

import { createCrudRepo } from '@/infra/database/crud.repo.ts'
import type { CrudRepo } from '@/infra/database/crud.repo.ts'
import { allOf, eq, searchAcross, sql } from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'

import type { MenuCategoryDto, MenuCategoryFilterDto } from './category.contract.ts'

// ─── Types ───

type CategoryInsert = typeof menuCategories.$inferInsert
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

export interface ICategoryRepo extends CrudRepo<MenuCategoryDto, CategoryInsert> {
	findByLocation(locationId: number, db?: DbContext): Promise<MenuCategoryDto[]>
	findPage(
		filter: MenuCategoryFilterDto,
		db?: DbContext,
	): Promise<WithPaginationResult<MenuCategoryDto>>
}

// ─── Implementation ───

export function createCategoryRepo(baseDb: DbContext): ICategoryRepo {
	const crud = createCrudRepo({ db: baseDb, table: menuCategories, toDto })
	const orderBy = sql`${menuCategories.sortOrder} asc, ${menuCategories.id} asc`

	return {
		...crud,

		async findByLocation(locationId, db = baseDb) {
			const rows = await db
				.select()
				.from(menuCategories)
				.where(eq(menuCategories.locationId, locationId))
				.orderBy(orderBy)
			return rows.map(toDto)
		},

		findPage: (filter, db) =>
			crud.paginate(
				filter,
				{
					where: allOf(
						eq(menuCategories.locationId, filter.locationId),
						searchAcross(filter.q, [menuCategories.name]),
					),
					orderBy,
				},
				db,
			),
	}
}

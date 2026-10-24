import { menuItems } from '@/db/schema/menu.ts'

import { createCrudRepo } from '@/infra/database/crud.repo.ts'
import type { CrudRepo } from '@/infra/database/crud.repo.ts'
import { allOf, eq, eqIf, searchAcross, sql, takeFirst } from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'

import type { MenuItemDto, MenuItemFilterDto } from './item.contract.ts'

// ─── Types ───

type ItemInsert = typeof menuItems.$inferInsert
type ItemRow = typeof menuItems.$inferSelect

function toDto(row: ItemRow): MenuItemDto {
	return {
		id: row.id,
		locationId: row.locationId,
		sku: row.sku,
		name: row.name,
		categoryId: row.categoryId,
		basePrice: row.basePrice,
		status: row.status,
		imageUrl: row.imageUrl,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

// ─── Interface ───

export interface IItemRepo extends CrudRepo<MenuItemDto, ItemInsert> {
	findPage(filter: MenuItemFilterDto, db?: DbContext): Promise<WithPaginationResult<MenuItemDto>>
	findBySkuAndLocation(
		sku: string,
		locationId: number,
		db?: DbContext,
	): Promise<MenuItemDto | undefined>
}

// ─── Implementation ───

export function createItemRepo(baseDb: DbContext): IItemRepo {
	const crud = createCrudRepo({ db: baseDb, table: menuItems, toDto })

	return {
		...crud,

		findPage: (filter, db) =>
			crud.paginate(
				filter,
				{
					where: allOf(
						eq(menuItems.locationId, filter.locationId),
						eqIf(menuItems.categoryId, filter.categoryId),
						eqIf(menuItems.status, filter.status),
						searchAcross(filter.q, [menuItems.sku, menuItems.name]),
					),
					orderBy: sql`${menuItems.name} asc`,
				},
				db,
			),

		async findBySkuAndLocation(sku, locationId, db = baseDb) {
			const row = await db
				.select()
				.from(menuItems)
				.where(allOf(eq(menuItems.sku, sku), eq(menuItems.locationId, locationId)))
				.limit(1)
				.then(takeFirst)
			return row ? toDto(row) : undefined
		},
	}
}

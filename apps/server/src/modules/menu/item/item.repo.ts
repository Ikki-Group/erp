import { menuItems } from '@/db/schema/menu.ts'

import {
	allOf,
	eq,
	eqIf,
	searchAcross,
	sql,
	takeFirst,
	toLimitOffset,
	buildPaginationMeta,
} from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { MenuItemDto, MenuItemFilterDto } from './item.contract.ts'

// ─── Types ───

type ItemInsert = typeof menuItems.$inferInsert
type ItemUpdate = Partial<Omit<ItemInsert, 'id'>>
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

export interface IItemRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<MenuItemDto | undefined>
	findPage(filter: MenuItemFilterDto, db?: DbContext): Promise<WithPaginationResult<MenuItemDto>>
	findBySkuAndLocation(sku: string, locationId: number, db?: DbContext): Promise<MenuItemDto | undefined>
	insert(data: ItemInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: ItemUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

// ─── Implementation ───

export class ItemRepo implements IItemRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext = this.db): Promise<MenuItemDto | undefined> {
		const row = await db
			.select()
			.from(menuItems)
			.where(eq(menuItems.id, id))
			.limit(1)
			.then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async findPage(
		filter: MenuItemFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<MenuItemDto>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: menuItems.id,
				locationId: menuItems.locationId,
				sku: menuItems.sku,
				name: menuItems.name,
				categoryId: menuItems.categoryId,
				basePrice: menuItems.basePrice,
				status: menuItems.status,
				imageUrl: menuItems.imageUrl,
				createdAt: menuItems.createdAt,
				updatedAt: menuItems.updatedAt,
				createdBy: menuItems.createdBy,
				updatedBy: menuItems.updatedBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(menuItems)
			.where(where)
			.orderBy(sql`${menuItems.name} asc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async findBySkuAndLocation(
		sku: string,
		locationId: number,
		db: DbContext = this.db,
	): Promise<MenuItemDto | undefined> {
		const row = await db
			.select()
			.from(menuItems)
			.where(allOf(eq(menuItems.sku, sku), eq(menuItems.locationId, locationId)))
			.limit(1)
			.then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async insert(data: ItemInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(menuItems)
			.values(data)
			.returning({ id: menuItems.id })
		return result
	}

	async update(id: number, data: ItemUpdate, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(menuItems)
			.set(data)
			.where(eq(menuItems.id, id))
			.returning({ id: menuItems.id })
		return result
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.delete(menuItems)
			.where(eq(menuItems.id, id))
			.returning({ id: menuItems.id })
		return result
	}

	// ─── Private ───

	#buildWhere(filter: MenuItemFilterDto) {
		return allOf(
			eq(menuItems.locationId, filter.locationId),
			eqIf(menuItems.categoryId, filter.categoryId),
			eqIf(menuItems.status, filter.status),
			searchAcross(filter.q, [menuItems.sku, menuItems.name]),
		)
	}
}

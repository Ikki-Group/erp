import { tables } from '@/db/schema/pos.ts'

import {
	allOf,
	and,
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

import type { TableDto, TableFilterDto, TableStatusEnum } from './table.contract.ts'

// ─── Types ───

type TableInsert = typeof tables.$inferInsert
type TableUpdate = Partial<Omit<TableInsert, 'id'>>
type TableRow = typeof tables.$inferSelect

/** Maps a raw DB row to the DTO shape. */
function toDto(row: TableRow): TableDto {
	return {
		id: row.id,
		locationId: row.locationId,
		number: row.number,
		capacity: row.capacity,
		status: row.status,
		isActive: row.isActive === 1,
	}
}

// ─── Interface ───

export interface ITableRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<TableDto | undefined>
	findByLocation(locationId: number, db?: DbContext): Promise<TableDto[]>
	findPage(filter: TableFilterDto, db?: DbContext): Promise<WithPaginationResult<TableDto>>
	findByLocationAndNumber(locationId: number, number: string, db?: DbContext): Promise<TableDto | undefined>
	insert(data: TableInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: TableUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
	updateStatus(id: number, status: TableStatusEnum, db?: DbContext): Promise<EntityRef | undefined>
}

// ─── Implementation ───

export class TableRepo implements ITableRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext = this.db): Promise<TableDto | undefined> {
		const row = await db
			.select()
			.from(tables)
			.where(eq(tables.id, id))
			.limit(1)
			.then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async findByLocation(locationId: number, db: DbContext = this.db): Promise<TableDto[]> {
		const rows = await db
			.select()
			.from(tables)
			.where(and(eq(tables.locationId, locationId), eq(tables.isActive, 1)))
			.orderBy(sql`${tables.number} asc`)
		return rows.map(toDto)
	}

	async findPage(
		filter: TableFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<TableDto>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: tables.id,
				locationId: tables.locationId,
				number: tables.number,
				capacity: tables.capacity,
				status: tables.status,
				isActive: tables.isActive,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(tables)
			.where(where)
			.orderBy(sql`${tables.number} asc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async findByLocationAndNumber(
		locationId: number,
		number: string,
		db: DbContext = this.db,
	): Promise<TableDto | undefined> {
		const row = await db
			.select()
			.from(tables)
			.where(and(eq(tables.locationId, locationId), eq(tables.number, number)))
			.limit(1)
			.then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async insert(data: TableInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.insert(tables)
			.values(data)
			.returning({ id: tables.id })
		return result
	}

	async update(id: number, data: TableUpdate, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(tables)
			.set(data)
			.where(eq(tables.id, id))
			.returning({ id: tables.id })
		return result
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(tables)
			.set({ isActive: 0 })
			.where(eq(tables.id, id))
			.returning({ id: tables.id })
		return result
	}

	async updateStatus(
		id: number,
		status: TableStatusEnum,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(tables)
			.set({ status })
			.where(eq(tables.id, id))
			.returning({ id: tables.id })
		return result
	}

	// ─── Private ───

	#buildWhere(filter: TableFilterDto) {
		return allOf(
			eq(tables.locationId, filter.locationId),
			eq(tables.isActive, 1),
			eqIf(tables.status, filter.status),
			searchAcross(filter.q, [tables.number]),
		)
	}
}

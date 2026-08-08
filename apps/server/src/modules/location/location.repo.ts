import { locations } from '@/db/schema/core.ts'

import {
	allOf,
	eqIf,
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

import type { LocationDto, LocationFilterDto } from './location.contract.ts'

// ─── Types ───

type LocationInsert = typeof locations.$inferInsert
type LocationUpdate = Partial<Omit<LocationInsert, 'id'>>
type LocationRow = typeof locations.$inferSelect

/** Maps a raw DB row to the DTO shape. */
function toDto(row: LocationRow): LocationDto {
	return {
		id: row.id,
		code: row.code,
		name: row.name,
		type: row.type,
		address: row.address,
		phone: row.phone,
		isActive: row.isActive === 1,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

// ─── Interface ───

export interface ILocationRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<LocationDto | undefined>
	findByIds(ids: number[], db?: DbContext): Promise<LocationDto[]>
	findMany(db?: DbContext): Promise<LocationDto[]>
	findPage(filter: LocationFilterDto, db?: DbContext): Promise<WithPaginationResult<LocationDto>>
	insert(data: LocationInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: LocationUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, data: LocationUpdate, db?: DbContext): Promise<EntityRef | undefined>
}

// ─── Implementation ───

export class LocationRepo implements ILocationRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext = this.db): Promise<LocationDto | undefined> {
		const row = await db
			.select()
			.from(locations)
			.where(eq(locations.id, id))
			.limit(1)
			.then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async findByIds(ids: number[], db: DbContext = this.db): Promise<LocationDto[]> {
		if (ids.length === 0) return []
		const rows = await db.select().from(locations).where(inArray(locations.id, ids))
		return rows.map(toDto)
	}

	async findMany(db: DbContext = this.db): Promise<LocationDto[]> {
		const rows = await db.select().from(locations)
		return rows.map(toDto)
	}

	async findPage(
		filter: LocationFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<LocationDto>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: locations.id,
				code: locations.code,
				name: locations.name,
				type: locations.type,
				address: locations.address,
				phone: locations.phone,
				isActive: locations.isActive,
				createdAt: locations.createdAt,
				updatedAt: locations.updatedAt,
				createdBy: locations.createdBy,
				updatedBy: locations.updatedBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(locations)
			.where(where)
			.orderBy(sql`${locations.id} desc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async insert(data: LocationInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db.insert(locations).values(data).returning({ id: locations.id })
		return result
	}

	async update(
		id: number,
		data: LocationUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(locations)
			.set(data)
			.where(eq(locations.id, id))
			.returning({ id: locations.id })
		return result
	}

	async remove(
		id: number,
		data: LocationUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(locations)
			.set({ ...data, isActive: 0 })
			.where(eq(locations.id, id))
			.returning({ id: locations.id })
		return result
	}

	// ─── Private ───

	#buildWhere(filter: LocationFilterDto) {
		return allOf(
			searchAcross(filter.q, [locations.code, locations.name]),
			eqIf(locations.type, filter.type),
		)
	}
}

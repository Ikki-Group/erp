import { and, ne } from 'drizzle-orm'

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
import type { DbContext, Tx } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { LocationDto, LocationFilterDto } from './location.contract.ts'
import { LocationError } from './location.internal.ts'

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
		isActive: row.isActive,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

// ─── Interface ───

export interface ILocationRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext | Tx): Promise<LocationDto | undefined>
	findByIds(ids: number[], db?: DbContext | Tx): Promise<LocationDto[]>
	findMany(db?: DbContext | Tx): Promise<LocationDto[]>
	findPage(
		filter: LocationFilterDto,
		db?: DbContext | Tx,
	): Promise<WithPaginationResult<LocationDto>>
	insert(data: LocationInsert, db?: DbContext | Tx): Promise<EntityRef | undefined>
	update(id: number, data: LocationUpdate, db?: DbContext | Tx): Promise<EntityRef | undefined>
	remove(id: number, data: LocationUpdate, db?: DbContext | Tx): Promise<EntityRef | undefined>
	assertNoConflict(
		data: { code: string; name: string },
		excludeId: number | undefined,
		db: DbContext | Tx,
	): Promise<void>
}

// ─── Implementation ───

export class LocationRepo implements ILocationRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext | Tx = this.db): Promise<LocationDto | undefined> {
		const row = await db
			.select()
			.from(locations)
			.where(and(eq(locations.id, id), eq(locations.isActive, true)))
			.limit(1)
			.then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async findByIds(ids: number[], db: DbContext | Tx = this.db): Promise<LocationDto[]> {
		if (ids.length === 0) return []
		const rows = await db.select().from(locations).where(inArray(locations.id, ids))
		return rows.map(toDto)
	}

	async findMany(db: DbContext | Tx = this.db): Promise<LocationDto[]> {
		const rows = await db.select().from(locations).where(eq(locations.isActive, true))
		return rows.map(toDto)
	}

	async findPage(
		filter: LocationFilterDto,
		db: DbContext | Tx = this.db,
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

	async insert(data: LocationInsert, db: DbContext | Tx = this.db): Promise<EntityRef | undefined> {
		const [result] = await db.insert(locations).values(data).returning({ id: locations.id })
		return result
	}

	async update(
		id: number,
		data: LocationUpdate,
		db: DbContext | Tx = this.db,
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
		db: DbContext | Tx = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(locations)
			.set({ ...data, isActive: false })
			.where(eq(locations.id, id))
			.returning({ id: locations.id })
		return result
	}

	async assertNoConflict(
		data: { code: string; name: string },
		excludeId: number | undefined,
		db: DbContext | Tx,
	): Promise<void> {
		const notSelf = excludeId ? ne(locations.id, excludeId) : undefined
		const byCode = await db
			.select({ id: locations.id })
			.from(locations)
			.where(and(eq(locations.code, data.code), notSelf))
			.limit(1)
			.then(takeFirst)
		if (byCode) throw LocationError.codeExists()

		const byName = await db
			.select({ id: locations.id })
			.from(locations)
			.where(and(eq(locations.name, data.name), notSelf))
			.limit(1)
			.then(takeFirst)
		if (byName) throw LocationError.nameExists()
	}

	// ─── Private ───

	#buildWhere(filter: LocationFilterDto) {
		return allOf(
			eq(locations.isActive, true),
			searchAcross(filter.q, [locations.code, locations.name]),
			eqIf(locations.type, filter.type),
		)
	}
}

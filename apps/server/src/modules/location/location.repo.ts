import { eq, getColumns, sql, type SQL } from 'drizzle-orm'

import { locationsTable, materialLocationsTable, userAssignmentsTable } from '@/db/schema'

import {
	allOf,
	countWhere,
	eqIf,
	existsWhere,
	paginateWindow,
	searchAcross,
	sortBy,
	takeFirst,
	toLimitOffset,
	type DbContext,
} from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type { LocationFilterSchema, LocationSchema } from './location.contract'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

type LocationInsert = typeof locationsTable.$inferInsert
type LocationUpdate = PgUpdateSetSource<typeof locationsTable>

/**
 * Repository port for the location module. Services depend on this interface
 * (not the concrete class) so they can be unit-tested with plain in-memory
 * fakes and no database. Not-found reads return `undefined`; writes return the
 * affected `EntityRef` or `undefined`. Repos never throw for "not found" — the
 * service decides error semantics. Every write accepts an optional `db`
 * override so it can participate in a caller's transaction.
 */
export interface ILocationRepo {
	/** The default database context this repo is bound to (client or tx). */
	readonly db: DbContext
	findMany(filter?: LocationFilterSchema, db?: DbContext): Promise<LocationSchema[]>
	findPage(
		filter: LocationFilterSchema,
		db?: DbContext,
	): Promise<WithPaginationResult<LocationSchema>>
	findById(id: number, db?: DbContext): Promise<LocationSchema | undefined>
	count(db?: DbContext): Promise<number>
	hasReferences(id: number, db?: DbContext): Promise<boolean>
	insert(data: LocationInsert, db?: DbContext): Promise<EntityRef | undefined>
	insertMany(items: LocationInsert[], db?: DbContext): Promise<void>
	update(id: number, data: LocationUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class LocationRepo implements ILocationRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter: Partial<Pick<LocationFilterSchema, 'q' | 'type'>>): SQL | undefined {
		return allOf(
			searchAcross(filter.q, [locationsTable.name, locationsTable.code]),
			eqIf(locationsTable.type, filter.type),
		)
	}

	async findMany(
		filter: Partial<Pick<LocationFilterSchema, 'q' | 'type'>> = {},
		db: DbContext = this.db,
	): Promise<LocationSchema[]> {
		const where = this.#buildWhere(filter)
		return db.select().from(locationsTable).where(where)
	}

	async findPage(
		filter: LocationFilterSchema,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<LocationSchema>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		// Single round-trip: data + total via `count(*) over()`.
		const rows = await db
			.select({ ...getColumns(locationsTable), rowCount: sql<number>`count(*) over()` })
			.from(locationsTable)
			.where(where)
			.orderBy(sortBy(locationsTable.updatedAt, 'desc'))
			.limit(limit)
			.offset(offset)

		return paginateWindow(rows, filter)
	}

	async findById(id: number, db: DbContext = this.db): Promise<LocationSchema | undefined> {
		return db
			.select()
			.from(locationsTable)
			.where(eq(locationsTable.id, id))
			.limit(1)
			.then(takeFirst)
	}

	async count(db: DbContext = this.db): Promise<number> {
		return countWhere(db, locationsTable)
	}

	async insert(data: LocationInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.insert(locationsTable)
			.values({ ...data })
			.returning({ id: locationsTable.id })

		return res
	}

	async insertMany(items: LocationInsert[], db: DbContext = this.db): Promise<void> {
		await db.insert(locationsTable).values(items).onConflictDoNothing()
	}

	async update(
		id: number,
		data: LocationUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(locationsTable)
			.set({ ...data })
			.where(eq(locationsTable.id, id))
			.returning({ id: locationsTable.id })
		return res
	}

	async hasReferences(id: number, db: DbContext = this.db): Promise<boolean> {
		const hasAssignments = await existsWhere(
			db,
			userAssignmentsTable,
			eq(userAssignmentsTable.locationId, id),
		)
		if (hasAssignments) return true

		return existsWhere(db, materialLocationsTable, eq(materialLocationsTable.locationId, id))
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.delete(locationsTable)
			.where(eq(locationsTable.id, id))
			.returning({ id: locationsTable.id })
		return res
	}
}

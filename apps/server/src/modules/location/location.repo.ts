import { and, count, eq, or, SQL } from 'drizzle-orm'

import { locationsTable } from '@/db/schema'

import { paginate, searchFilter, sortBy, takeFirst, type DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type { LocationDto, LocationFilterDto } from './location.contract'
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
	findMany(filter?: LocationFilterDto, db?: DbContext): Promise<LocationDto[]>
	findPage(filter: LocationFilterDto, db?: DbContext): Promise<WithPaginationResult<LocationDto>>
	findById(id: number, db?: DbContext): Promise<LocationDto | undefined>
	count(db?: DbContext): Promise<number>
	insert(data: LocationInsert, db?: DbContext): Promise<EntityRef | undefined>
	insertMany(items: LocationInsert[], db?: DbContext): Promise<void>
	update(id: number, data: LocationUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class LocationRepo implements ILocationRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter: Partial<Pick<LocationFilterDto, 'q' | 'type'>>): SQL | undefined {
		const { q, type } = filter
		return and(
			q === undefined
				? undefined
				: or(searchFilter(locationsTable.name, q), searchFilter(locationsTable.code, q)),
			type === undefined ? undefined : eq(locationsTable.type, type),
		)
	}

	async findMany(
		filter: Partial<Pick<LocationFilterDto, 'q' | 'type'>> = {},
		db: DbContext = this.db,
	): Promise<LocationDto[]> {
		const where = this.#buildWhere(filter)
		return db.select().from(locationsTable).where(where)
	}

	async findPage(
		filter: LocationFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<LocationDto>> {
		const where = this.#buildWhere(filter)

		return paginate<LocationDto>({
			data: ({ limit, offset }) =>
				db
					.select()
					.from(locationsTable)
					.where(where)
					.orderBy(sortBy(locationsTable.updatedAt, 'desc'))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: () => db.select({ count: count() }).from(locationsTable).where(where),
		})
	}

	async findById(id: number, db: DbContext = this.db): Promise<LocationDto | undefined> {
		return db
			.select()
			.from(locationsTable)
			.where(eq(locationsTable.id, id))
			.limit(1)
			.then(takeFirst)
	}

	async count(db: DbContext = this.db): Promise<number> {
		return db
			.select({ count: count() })
			.from(locationsTable)
			.then((rows) => rows[0]?.count ?? 0)
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

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.delete(locationsTable)
			.where(eq(locationsTable.id, id))
			.returning({ id: locationsTable.id })
		return res
	}
}

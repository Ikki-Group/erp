import { and, count, eq, or, SQL } from 'drizzle-orm'

import { locationsTable } from '@/db/schema'

import { paginate, searchFilter, sortBy, takeFirst, type DbContext } from '@/infra/database'

import type { PaginationQuery, WithPaginationResult } from '@/types/pagination'
import type { EntityRef } from '@/types/utils'

import type { LocationDto, LocationTypeEnum } from './location.contract'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

interface LocationFilter {
	q?: string | undefined
	type?: LocationTypeEnum | undefined
}

type LocationInsert = typeof locationsTable.$inferInsert
type LocationUpdate = PgUpdateSetSource<typeof locationsTable>

export class LocationRepo {
	constructor(private readonly db: DbContext) {}

	static use(db: DbContext) {
		return new LocationRepo(db)
	}

	#buildWhere(filter: LocationFilter): SQL | undefined {
		const { q, type } = filter
		return and(
			q === undefined
				? undefined
				: or(searchFilter(locationsTable.name, q), searchFilter(locationsTable.code, q)),
			type === undefined ? undefined : eq(locationsTable.type, type),
		)
	}

	async findMany(filter: LocationFilter, db: DbContext = this.db): Promise<LocationDto[]> {
		const where = this.#buildWhere(filter)
		return db.select().from(locationsTable).where(where)
	}

	async findPage(
		filter: LocationFilter & PaginationQuery,
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

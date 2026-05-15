import { and, count, eq, or } from 'drizzle-orm'

import {
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
} from '@/core/database'
import type { WithPaginationResult } from '@/core/database/pagination'

import { locationsTable } from '@/db/schema'

import type { ActorId, EntityRef } from '@/types/utils'

import type {
	LocationFilterSchema,
	LocationMutationSchema,
	LocationSchema,
} from './location.schema'

export class LocationRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getList(): Promise<LocationSchema[]> {
		return this.db.select().from(locationsTable)
	}

	async getListPaginated(
		filter: LocationFilterSchema,
	): Promise<WithPaginationResult<LocationSchema>> {
		const { q, type } = filter
		const where = and(
			q === undefined
				? undefined
				: or(searchFilter(locationsTable.name, q), searchFilter(locationsTable.code, q)),
			type === undefined ? undefined : eq(locationsTable.type, type),
		)

		return paginate<LocationSchema>({
			data: ({ limit, offset }) =>
				this.db
					.select()
					.from(locationsTable)
					.where(where)
					.orderBy(sortBy(locationsTable.updatedAt, 'desc'))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: this.db.select({ count: count() }).from(locationsTable).where(where),
		})
	}

	async getById(id: number): Promise<LocationSchema | undefined> {
		return this.db
			.select()
			.from(locationsTable)
			.where(eq(locationsTable.id, id))
			.limit(1)
			.then(takeFirst)
	}

	async count(): Promise<number> {
		return this.db
			.select({ count: count() })
			.from(locationsTable)
			.then((rows) => rows[0]?.count ?? 0)
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: LocationMutationSchema, actorId: ActorId): Promise<EntityRef | undefined> {
		const metadata = stampCreate(actorId)
		const [res] = await this.db
			.insert(locationsTable)
			.values({ ...data, ...metadata })
			.returning({ id: locationsTable.id })

		return res
	}

	async update(
		id: number,
		data: LocationMutationSchema,
		actorId: ActorId,
	): Promise<EntityRef | undefined> {
		const metadata = stampUpdate(actorId)
		const [res] = await this.db
			.update(locationsTable)
			.set({ ...data, ...metadata })
			.where(eq(locationsTable.id, id))
			.returning({ id: locationsTable.id })

		return res
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		const [res] = await this.db
			.delete(locationsTable)
			.where(eq(locationsTable.id, id))
			.returning({ id: locationsTable.id })

		return res
	}
}

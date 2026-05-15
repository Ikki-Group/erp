import { count, eq } from 'drizzle-orm'

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

import { rolesTable } from '@/db/schema'

import type { ActorId, EntityRef } from '@/types/utils'

import type { RoleFilterSchema, RoleMutationSchema, RoleSchema } from './role.schema'

export class RoleRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(filter: RoleFilterSchema): Promise<WithPaginationResult<RoleSchema>> {
		const { q } = filter
		const where = q === undefined ? undefined : searchFilter(rolesTable.name, q)

		return paginate<RoleSchema>({
			data: ({ limit, offset }) =>
				this.db
					.select()
					.from(rolesTable)
					.where(where)
					.orderBy(sortBy(rolesTable.updatedAt, 'desc'))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: this.db.select({ count: count() }).from(rolesTable).where(where),
		})
	}

	async getList(): Promise<RoleSchema[]> {
		return this.db.select().from(rolesTable)
	}

	async getById(id: number): Promise<RoleSchema | undefined> {
		return this.db.select().from(rolesTable).where(eq(rolesTable.id, id)).limit(1).then(takeFirst)
	}

	async count(): Promise<number> {
		return this.db
			.select({ count: count() })
			.from(rolesTable)
			.then((rows) => rows[0]?.count ?? 0)
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: RoleMutationSchema, actorId: ActorId): Promise<EntityRef | undefined> {
		const metadata = stampCreate(actorId)
		const [res] = await this.db
			.insert(rolesTable)
			.values({ ...data, ...metadata })
			.returning({ id: rolesTable.id })

		return res
	}

	async update(
		id: number,
		data: RoleMutationSchema,
		actorId: ActorId,
	): Promise<EntityRef | undefined> {
		const metadata = stampUpdate(actorId)
		const [res] = await this.db
			.update(rolesTable)
			.set({ ...data, ...metadata })
			.where(eq(rolesTable.id, id))
			.returning({ id: rolesTable.id })

		return res
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		const [res] = await this.db
			.delete(rolesTable)
			.where(eq(rolesTable.id, id))
			.returning({ id: rolesTable.id })

		return res
	}
}

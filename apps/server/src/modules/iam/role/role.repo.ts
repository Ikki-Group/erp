import { count, eq, SQL } from 'drizzle-orm'

import { rolesTable } from '@/db/schema'

import { paginate, searchFilter, sortBy, takeFirst, type DbClient } from '@/infra/database'

import type { PaginationQuery, WithPaginationResult } from '@/types/pagination'
import type { EntityRef } from '@/types/utils'

import type { RoleDto } from '@/modules/iam/role/role.contract'

import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

interface RoleFilter {
	q?: string | undefined
}

type RoleInsert = typeof rolesTable.$inferInsert
type RoleUpdate = PgUpdateSetSource<typeof rolesTable>

export class RoleRepo {
	constructor(private readonly db: DbClient) {}

	#buildQuery(filter: RoleFilter): SQL | undefined {
		const { q } = filter

		return q === undefined ? undefined : searchFilter(rolesTable.name, q)
	}

	async findMany(filter: RoleFilter = {}): Promise<RoleDto[]> {
		return this.db
			.select()
			.from(rolesTable)
			.orderBy(sortBy(rolesTable.updatedAt, 'desc'))
			.where(this.#buildQuery(filter))
	}

	async findPage(filter: RoleFilter & PaginationQuery): Promise<WithPaginationResult<RoleDto>> {
		const { q } = filter
		const where = q === undefined ? undefined : searchFilter(rolesTable.name, q)

		return paginate<RoleDto>({
			data: ({ limit, offset }) =>
				this.db
					.select()
					.from(rolesTable)
					.where(where)
					.orderBy(sortBy(rolesTable.updatedAt, 'desc'))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: () => this.db.select({ count: count() }).from(rolesTable).where(where),
		})
	}

	async findById(id: number): Promise<RoleDto | undefined> {
		return this.db.select().from(rolesTable).where(eq(rolesTable.id, id)).limit(1).then(takeFirst)
	}

	async count(): Promise<number> {
		return this.db
			.select({ count: count() })
			.from(rolesTable)
			.then((rows) => rows[0]?.count ?? 0)
	}

	async create(data: RoleInsert): Promise<EntityRef | undefined> {
		const [res] = await this.db.insert(rolesTable).values(data).returning({ id: rolesTable.id })
		return res
	}

	async update(id: number, data: RoleUpdate): Promise<EntityRef | undefined> {
		const [res] = await this.db
			.update(rolesTable)
			.set(data)
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

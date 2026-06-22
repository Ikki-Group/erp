import { and, count, eq, SQL } from 'drizzle-orm'

import { rolesTable } from '@/db/schema'

import { paginate, searchFilter, sortBy, takeFirst, type DbContext } from '@/infra/database'

import type { PaginationQuery, WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type { RoleDto } from '@/modules/iam/role/role.contract'

import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

interface RoleFilter {
	q?: string | undefined
}

type RoleInsert = typeof rolesTable.$inferInsert
type RoleUpdate = PgUpdateSetSource<typeof rolesTable>

export class RoleRepo {
	constructor(private readonly db: DbContext) {}

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

	async findById(id: number, db = this.db): Promise<RoleDto | undefined> {
		return db.select().from(rolesTable).where(eq(rolesTable.id, id)).limit(1).then(takeFirst)
	}

	async count(): Promise<number> {
		return this.db
			.select({ count: count() })
			.from(rolesTable)
			.then((rows) => rows[0]?.count ?? 0)
	}

	async insert(data: RoleInsert, db = this.db): Promise<EntityRef | undefined> {
		const [res] = await db.insert(rolesTable).values(data).returning({ id: rolesTable.id })
		return res
	}

	async insertMany(data: RoleInsert[], db = this.db) {
		await db.insert(rolesTable).values(data).returning({ id: rolesTable.id })
	}

	async update(id: number, data: RoleUpdate, db = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(rolesTable)
			.set(data)
			.where(eq(rolesTable.id, id))
			.returning({ id: rolesTable.id })

		return res
	}

	async remove(id: number, force = false, db = this.db): Promise<EntityRef | undefined> {
		const where = and(eq(rolesTable.id, id), !force ? eq(rolesTable.isSystem, false) : undefined)
		const [res] = await db.delete(rolesTable).where(where).returning({ id: rolesTable.id })

		return res
	}
}

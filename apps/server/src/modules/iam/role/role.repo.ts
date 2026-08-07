import { and, count, eq, getColumns, sql, type SQL } from 'drizzle-orm'

import { rolesTable } from '@/db/schema'

import {
	allOf,
	eqIf,
	paginateWindow,
	searchFilter,
	sortBy,
	takeFirst,
	toLimitOffset,
	type DbContext,
} from '@/infra/database'
import type { PaginationQuery, WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type { RoleDto, RoleScopeEnum } from './role.contract'
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core'

interface RoleFilter {
	q?: string | undefined
	scope?: RoleScopeEnum | undefined
}

type RoleInsert = typeof rolesTable.$inferInsert
type RoleUpdate = PgUpdateSetSource<typeof rolesTable>

export interface IRoleRepo {
	readonly db: DbContext
	findMany(filter?: RoleFilter, db?: DbContext): Promise<RoleDto[]>
	findPage(
		filter: RoleFilter & PaginationQuery,
		db?: DbContext,
	): Promise<WithPaginationResult<RoleDto>>
	findById(id: number, db?: DbContext): Promise<RoleDto | undefined>
	count(db?: DbContext): Promise<number>
	insert(data: RoleInsert, db?: DbContext): Promise<EntityRef | undefined>
	insertMany(data: RoleInsert[], db?: DbContext): Promise<void>
	update(id: number, data: RoleUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, force?: boolean, db?: DbContext): Promise<EntityRef | undefined>
}

export class RoleRepo implements IRoleRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter: RoleFilter): SQL | undefined {
		return allOf(searchFilter(rolesTable.name, filter.q), eqIf(rolesTable.scope, filter.scope))
	}

	async findMany(filter: RoleFilter = {}, db: DbContext = this.db): Promise<RoleDto[]> {
		return db
			.select()
			.from(rolesTable)
			.where(this.#buildWhere(filter))
			.orderBy(sortBy(rolesTable.updatedAt, 'desc'))
	}

	async findPage(
		filter: RoleFilter & PaginationQuery,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<RoleDto>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({ ...getColumns(rolesTable), rowCount: sql<number>`count(*) over()` })
			.from(rolesTable)
			.where(where)
			.orderBy(sortBy(rolesTable.updatedAt, 'desc'))
			.limit(limit)
			.offset(offset)

		return paginateWindow(rows, filter)
	}

	async findById(id: number, db: DbContext = this.db): Promise<RoleDto | undefined> {
		return db.select().from(rolesTable).where(eq(rolesTable.id, id)).limit(1).then(takeFirst)
	}

	async count(db: DbContext = this.db): Promise<number> {
		return db
			.select({ count: count() })
			.from(rolesTable)
			.then((rows) => rows[0]?.count ?? 0)
	}

	async insert(data: RoleInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db.insert(rolesTable).values(data).returning({ id: rolesTable.id })
		return res
	}

	async insertMany(data: RoleInsert[], db: DbContext = this.db): Promise<void> {
		await db.insert(rolesTable).values(data).returning({ id: rolesTable.id })
	}

	async update(
		id: number,
		data: RoleUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [res] = await db
			.update(rolesTable)
			.set(data)
			.where(eq(rolesTable.id, id))
			.returning({ id: rolesTable.id })

		return res
	}

	async remove(id: number, force = false, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const where = and(eq(rolesTable.id, id), force ? undefined : eq(rolesTable.isSystem, false))
		const [res] = await db.delete(rolesTable).where(where).returning({ id: rolesTable.id })

		return res
	}
}

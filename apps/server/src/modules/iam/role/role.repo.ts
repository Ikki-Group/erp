import { roles } from '@/db/schema/iam.ts'

import {
	allOf,
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

import type { RoleDto, RoleFilterDto } from './role.contract.ts'

// ─── Types ───

type RoleInsert = typeof roles.$inferInsert
type RoleUpdate = Partial<Omit<RoleInsert, 'id'>>
type RoleRow = typeof roles.$inferSelect

/** Maps a raw DB row to the DTO shape. */
function toDto(row: RoleRow): RoleDto {
	return {
		id: row.id,
		code: row.code,
		name: row.name,
		isSystem: row.isSystem,
		permissions: Array.isArray(row.permissions)
			? row.permissions.filter((p): p is string => typeof p === 'string')
			: [],
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

// ─── Interface ───

export interface IRoleRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<RoleDto | undefined>
	findByIds(ids: number[], db?: DbContext): Promise<RoleDto[]>
	findMany(db?: DbContext): Promise<RoleDto[]>
	findPage(filter: RoleFilterDto, db?: DbContext): Promise<WithPaginationResult<RoleDto>>
	insert(data: RoleInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: RoleUpdate, db?: DbContext): Promise<EntityRef | undefined>
}

// ─── Implementation ───

export class RoleRepo implements IRoleRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext = this.db): Promise<RoleDto | undefined> {
		const row = await db.select().from(roles).where(eq(roles.id, id)).limit(1).then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async findByIds(ids: number[], db: DbContext = this.db): Promise<RoleDto[]> {
		if (ids.length === 0) return []
		const rows = await db.select().from(roles).where(inArray(roles.id, ids))
		return rows.map(toDto)
	}

	async findMany(db: DbContext = this.db): Promise<RoleDto[]> {
		const rows = await db.select().from(roles)
		return rows.map(toDto)
	}

	async findPage(
		filter: RoleFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<RoleDto>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: roles.id,
				code: roles.code,
				name: roles.name,
				isSystem: roles.isSystem,
				permissions: roles.permissions,
				createdAt: roles.createdAt,
				updatedAt: roles.updatedAt,
				createdBy: roles.createdBy,
				updatedBy: roles.updatedBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(roles)
			.where(where)
			.orderBy(sql`${roles.id} desc`)
			.limit(limit)
			.offset(offset)

		const total = rows[0]?.rowCount ?? 0
		return {
			data: rows.map((row) => toDto(row)),
			meta: buildPaginationMeta(filter.page, filter.limit, total),
		}
	}

	async insert(data: RoleInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db.insert(roles).values(data).returning({ id: roles.id })
		return result
	}

	async update(
		id: number,
		data: RoleUpdate,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(roles)
			.set(data)
			.where(eq(roles.id, id))
			.returning({ id: roles.id })
		return result
	}

	// ─── Private ───

	#buildWhere(filter: RoleFilterDto) {
		return allOf(searchAcross(filter.q, [roles.code, roles.name]))
	}
}

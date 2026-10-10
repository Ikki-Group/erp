import { roles, userAssignments } from '@/db/schema/iam.ts'

import {
	allOf,
	eq,
	eqIf,
	searchAcross,
	sql,
	takeFirst,
	toLimitOffset,
	buildPaginationMeta,
} from '@/infra/database/index.ts'
import type { Db, DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { RoleDto, RoleFilterDto } from '@ikki/contract/iam/role'

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
		description: row.description,
		isSystem: row.isSystem,
		permissions: row.permissions,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
		updatedBy: row.updatedBy,
	}
}

// ─── Implementation ───

export class RoleRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: Db = this.db): Promise<RoleDto | undefined> {
		const row = await db.select().from(roles).where(eq(roles.id, id)).limit(1).then(takeFirst)
		return row ? toDto(row) : undefined
	}

	async findPage(filter: RoleFilterDto, db: Db = this.db): Promise<WithPaginationResult<RoleDto>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		const rows = await db
			.select({
				id: roles.id,
				code: roles.code,
				name: roles.name,
				description: roles.description,
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

	async insert(data: RoleInsert, db: Db = this.db): Promise<EntityRef | undefined> {
		const [result] = await db.insert(roles).values(data).returning({ id: roles.id })
		return result
	}

	async update(id: number, data: RoleUpdate, db: Db = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(roles)
			.set(data)
			.where(eq(roles.id, id))
			.returning({ id: roles.id })
		return result
	}

	async countAssignments(roleId: number, db: Db = this.db): Promise<number> {
		const rows = await db
			.select({ id: userAssignments.id })
			.from(userAssignments)
			.where(eq(userAssignments.roleId, roleId))
		return rows.length
	}

	async remove(id: number, db: Db = this.db): Promise<EntityRef | undefined> {
		const [result] = await db.delete(roles).where(eq(roles.id, id)).returning({ id: roles.id })
		return result
	}

	// ─── Private ───

	#buildWhere(filter: RoleFilterDto) {
		return allOf(
			searchAcross(filter.q, [roles.code, roles.name]),
			eqIf(roles.isSystem, filter.isSystem === undefined ? undefined : filter.isSystem === 1),
		)
	}
}

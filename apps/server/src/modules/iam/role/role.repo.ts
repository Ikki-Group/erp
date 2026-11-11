import { roles, userAssignments } from '@/db/schema/iam.ts'

import { createCrudRepo } from '@/infra/database/crud.repo.ts'
import type { CrudRepo } from '@/infra/database/crud.repo.ts'
import { allOf, eq, eqIf, searchAcross } from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'

import type { RoleDto, RoleFilterDto } from './role.contract.ts'

// ─── Types ───

type RoleInsert = typeof roles.$inferInsert
type RoleRow = typeof roles.$inferSelect

/** Maps a raw DB row to the DTO shape. */
function toDto(row: RoleRow): RoleDto {
	return {
		id: row.id,
		code: row.code,
		name: row.name,
		description: row.description,
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

export interface IRoleRepo extends CrudRepo<RoleDto, RoleInsert> {
	findPage(filter: RoleFilterDto, db?: DbContext): Promise<WithPaginationResult<RoleDto>>
	countAssignments(roleId: number, db?: DbContext): Promise<number>
}

// ─── Implementation ───

export function createRoleRepo(baseDb: DbContext): IRoleRepo {
	const crud = createCrudRepo({ db: baseDb, table: roles, toDto })

	return {
		...crud,

		findPage: (filter, db) =>
			crud.paginate(
				filter,
				{
					where: allOf(
						searchAcross(filter.q, [roles.code, roles.name]),
						eqIf(roles.isSystem, filter.isSystem === undefined ? undefined : filter.isSystem === 1),
					),
				},
				db,
			),

		async countAssignments(roleId, db = baseDb) {
			const rows = await db
				.select({ id: userAssignments.id })
				.from(userAssignments)
				.where(eq(userAssignments.roleId, roleId))
			return rows.length
		},
	}
}

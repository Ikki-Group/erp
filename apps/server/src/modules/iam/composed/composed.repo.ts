import { locations } from '@/db/schema/core.ts'
import { roles, userAssignments, users } from '@/db/schema/iam.ts'

import {
	allOf,
	eq,
	eqIf,
	searchAcross,
	sql,
	toLimitOffset,
	buildPaginationMeta,
} from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'

import type {
	AssignmentWithRelationsDto,
	ComposedUserFilterDto,
	UserDetailDto,
	UserListItemDto,
} from './composed.contract.ts'

// ─── Interface ───

export interface IComposedRepo {
	readonly db: DbContext
	findUserDetail(userId: number, db?: DbContext): Promise<UserDetailDto | undefined>
	findUserList(
		filter: ComposedUserFilterDto,
		db?: DbContext,
	): Promise<WithPaginationResult<UserListItemDto>>
}

// ─── Implementation ───

export class ComposedRepo implements IComposedRepo {
	constructor(readonly db: DbContext) {}

	async findUserDetail(
		userId: number,
		db: DbContext = this.db,
	): Promise<UserDetailDto | undefined> {
		// 1. Load user
		const [user] = await db
			.select({
				id: users.id,
				username: users.username,
				email: users.email,
				name: users.name,
				isActive: users.isActive,
				createdAt: users.createdAt,
				updatedAt: users.updatedAt,
				createdBy: users.createdBy,
				updatedBy: users.updatedBy,
			})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1)

		if (!user) return undefined

		// 2. Load assignments with role + location
		const assignmentRows = await db
			.select({
				id: userAssignments.id,
				roleId: userAssignments.roleId,
				locationId: userAssignments.locationId,
				roleCode: roles.code,
				roleName: roles.name,
				locationCode: locations.code,
				locationName: locations.name,
			})
			.from(userAssignments)
			.innerJoin(roles, eq(userAssignments.roleId, roles.id))
			.leftJoin(locations, eq(userAssignments.locationId, locations.id))
			.where(eq(userAssignments.userId, userId))

		const assignments: AssignmentWithRelationsDto[] = assignmentRows.map((row) => ({
			id: row.id,
			roleId: row.roleId,
			locationId: row.locationId,
			role: {
				id: row.roleId,
				code: row.roleCode,
				name: row.roleName,
			},
			location: row.locationId
				? {
						id: row.locationId,
						code: row.locationCode ?? '',
						name: row.locationName ?? '',
					}
				: null,
		}))

		return {
			id: user.id,
			username: user.username,
			email: user.email,
			name: user.name,
			isActive: user.isActive,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
			createdBy: user.createdBy,
			updatedBy: user.updatedBy,
			assignments,
		}
	}

	async findUserList(
		filter: ComposedUserFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<UserListItemDto>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)

		// 1. Paginated user rows with total count
		const userRows = await db
			.select({
				id: users.id,
				username: users.username,
				email: users.email,
				name: users.name,
				isActive: users.isActive,
				createdAt: users.createdAt,
				updatedAt: users.updatedAt,
				createdBy: users.createdBy,
				updatedBy: users.updatedBy,
				rowCount: sql<number>`count(*) over()`.as('row_count'),
			})
			.from(users)
			.where(where)
			.orderBy(sql`${users.id} desc`)
			.limit(limit)
			.offset(offset)

		if (userRows.length === 0) {
			return { data: [], meta: buildPaginationMeta(filter.page, filter.limit, 0) }
		}

		const total = userRows[0]?.rowCount ?? 0
		const userIds = userRows.map((u) => u.id)

		// 2. Batch-load role names for these users
		const assignmentRows = await db
			.select({
				userId: userAssignments.userId,
				roleName: roles.name,
			})
			.from(userAssignments)
			.innerJoin(roles, eq(userAssignments.roleId, roles.id))
			.where(sql`${userAssignments.userId} in ${userIds}`)

		// Group role names by userId
		const roleNamesByUser = new Map<number, string[]>()
		for (const row of assignmentRows) {
			const existing = roleNamesByUser.get(row.userId) ?? []
			if (!existing.includes(row.roleName)) {
				existing.push(row.roleName)
			}
			roleNamesByUser.set(row.userId, existing)
		}

		// 3. Map to DTOs
		const data: UserListItemDto[] = userRows.map((user) => ({
			id: user.id,
			username: user.username,
			email: user.email,
			name: user.name,
			isActive: user.isActive,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
			createdBy: user.createdBy,
			updatedBy: user.updatedBy,
			roleNames: roleNamesByUser.get(user.id) ?? [],
		}))

		return { data, meta: buildPaginationMeta(filter.page, filter.limit, total) }
	}

	// ─── Private ───

	#buildWhere(filter: ComposedUserFilterDto) {
		return allOf(
			searchAcross(filter.q, [users.username, users.email, users.name]),
			eqIf(users.isActive, filter.isActive),
		)
	}
}

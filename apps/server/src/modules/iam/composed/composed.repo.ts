import { eq, exists, getColumns, sql, and } from 'drizzle-orm'

import { userAssignmentsTable, usersTable } from '@/db/schema'

import {
	allOf,
	eqIf,
	paginateWindow,
	searchAcross,
	sortBy,
	toLimitOffset,
	type DbContext,
} from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'

import type { UserDto } from '../user/user.contract'
import type { UserFilterDto } from './composed.contract'

export interface IIamComposedRepo {
	readonly db: DbContext
	getListPaginated(filter: UserFilterDto): Promise<WithPaginationResult<UserDto>>
}

export class IamComposedRepo implements IIamComposedRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter: UserFilterDto) {
		const { q, isActive, locationId, roleId } = filter
		return allOf(
			searchAcross(q, [usersTable.fullname, usersTable.username, usersTable.email]),
			eqIf(usersTable.isActive, isActive),
			locationId === undefined
				? undefined
				: exists(
						this.db
							.select()
							.from(userAssignmentsTable)
							.where(
								and(
									eq(userAssignmentsTable.userId, usersTable.id),
									eq(userAssignmentsTable.locationId, locationId),
								),
							),
					),
			roleId === undefined
				? undefined
				: exists(
						this.db
							.select()
							.from(userAssignmentsTable)
							.where(
								and(
									eq(userAssignmentsTable.userId, usersTable.id),
									eq(userAssignmentsTable.roleId, roleId),
								),
							),
					),
		)
	}

	async getListPaginated(filter: UserFilterDto): Promise<WithPaginationResult<UserDto>> {
		const where = this.#buildWhere(filter)
		const { limit, offset } = toLimitOffset(filter)
		const { passwordHash: _, ...columns } = getColumns(usersTable)

		const rows = await this.db
			.select({ ...columns, rowCount: sql<number>`count(*) over()` })
			.from(usersTable)
			.where(where)
			.orderBy(sortBy(usersTable.updatedAt, 'desc'))
			.limit(limit)
			.offset(offset)

		return paginateWindow(rows, filter)
	}
}

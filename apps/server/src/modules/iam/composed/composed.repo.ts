import { and, count, eq, exists, getColumns, or } from 'drizzle-orm'

import { userAssignmentsTable, usersTable } from '@/db/schema'

import { paginate, searchFilter, sortBy, type DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'

import type { UserDto } from '../user/user.contract'
import type { UserFilterDto } from './composed.contract'

/**
 * Repository port for cross-submodule (composed) user reads. Owns the
 * user-list filtering logic (search, isActive, isRoot, location membership)
 * that the plain `UserRepo` does not, while still stripping the password hash.
 */
export interface IIamComposedRepo {
	readonly db: DbContext
	getListPaginated(filter: UserFilterDto): Promise<WithPaginationResult<UserDto>>
}

export class IamComposedRepo implements IIamComposedRepo {
	constructor(readonly db: DbContext) {}

	async getListPaginated(filter: UserFilterDto): Promise<WithPaginationResult<UserDto>> {
		const { q, isActive, isRoot, locationId } = filter
		const where = and(
			q === undefined
				? undefined
				: or(
						searchFilter(usersTable.fullname, q),
						searchFilter(usersTable.username, q),
						searchFilter(usersTable.email, q),
					),
			isActive === undefined ? undefined : eq(usersTable.isActive, isActive),
			isRoot === undefined ? undefined : eq(usersTable.isRoot, isRoot),
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
		)

		const { passwordHash: _, ...columns } = getColumns(usersTable)

		return paginate<UserDto>({
			data: ({ limit, offset }) =>
				this.db
					.select(columns)
					.from(usersTable)
					.where(where)
					.orderBy(sortBy(usersTable.updatedAt, 'desc'))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: () => this.db.select({ count: count() }).from(usersTable).where(where),
		})
	}
}

import { and, count, eq, exists, or } from 'drizzle-orm'

import { userAssignmentsTable, usersTable } from '@/db/schema'

import { paginate, searchFilter, sortBy, type DbClient } from '@/infra/database'

import type { WithPaginationResult } from '@/types/pagination'

import type { UserSchema } from '../user/user.schema'
import type { UserFilterSchema } from './composed.schema'

export class IamComposedRepo {
	constructor(private readonly db: DbClient) {}

	async getListPaginated(filter: UserFilterSchema): Promise<WithPaginationResult<UserSchema>> {
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

		return paginate<UserSchema>({
			data: ({ limit, offset }) =>
				this.db
					.select()
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

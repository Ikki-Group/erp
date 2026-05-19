import { and, count, eq, inArray } from 'drizzle-orm'

import { userAssignmentsTable } from '@/db/schema'

import { paginate, sortBy, type DbClient } from '@/infra/database'

import type { WithPaginationResult } from '@/types/pagination'
import type { ActorId } from '@/types/utils'
import type { OmitPaginationQuery } from '@/types/utils'

import type {
	UserAssignmentFilterSchema,
	UserAssignmentSchema,
	UserAssignmentUpsertSchema,
} from './assignment.schema'

export class UserAssignmentRepo {
	constructor(private readonly db: DbClient) {}

	/* --------------------------------- PRIVATE -------------------------------- */

	#buildWhereClause(
		filter: Partial<Pick<UserAssignmentFilterSchema, 'userId' | 'roleId' | 'locationId'>>,
	) {
		const { userId, roleId, locationId } = filter
		return and(
			userId ? eq(userAssignmentsTable.userId, userId) : undefined,
			roleId ? eq(userAssignmentsTable.roleId, roleId) : undefined,
			locationId ? eq(userAssignmentsTable.locationId, locationId) : undefined,
		)
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(
		filter: UserAssignmentFilterSchema,
	): Promise<WithPaginationResult<UserAssignmentSchema>> {
		const where = this.#buildWhereClause(filter)

		return paginate<UserAssignmentSchema>({
			data: ({ limit, offset }) =>
				this.db
					.select()
					.from(userAssignmentsTable)
					.where(where)
					.orderBy(sortBy(userAssignmentsTable.addedAt, 'desc'))
					.limit(limit)
					.offset(offset),
			pq: filter,
			countQuery: () => this.db.select({ count: count() }).from(userAssignmentsTable).where(where),
		})
	}

	async getList(
		filter: OmitPaginationQuery<UserAssignmentFilterSchema>,
	): Promise<UserAssignmentSchema[]> {
		return this.db.select().from(userAssignmentsTable).where(this.#buildWhereClause(filter))
	}

	/** Get assignments for multiple users in a single query */
	async getListByUserIds(userIds: number[]): Promise<UserAssignmentSchema[]> {
		return this.db
			.select()
			.from(userAssignmentsTable)
			.where(inArray(userAssignmentsTable.userId, userIds))
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async replaceBulkByUserId(
		userId: number,
		assignments: UserAssignmentUpsertSchema[],
		actorId: ActorId,
	): Promise<void> {
		await this.db.transaction(async (tx) => {
			await tx.delete(userAssignmentsTable).where(eq(userAssignmentsTable.userId, userId))

			if (assignments.length > 0) {
				await tx.insert(userAssignmentsTable).values(
					assignments.map((a) => ({
						userId,
						roleId: a.roleId,
						locationId: a.locationId,
						addedAt: new Date(),
						addedBy: actorId,
					})),
				)
			}
		})
	}

	async removeByUserAndLocation(userId: number, locationId: number): Promise<void> {
		await this.db
			.delete(userAssignmentsTable)
			.where(
				and(
					eq(userAssignmentsTable.userId, userId),
					eq(userAssignmentsTable.locationId, locationId),
				),
			)
	}

	/** Remove multiple users from a location in a single query */
	async removeUsersBulkFromLocation(userIds: number[], locationId: number): Promise<void> {
		await this.db
			.delete(userAssignmentsTable)
			.where(
				and(
					inArray(userAssignmentsTable.userId, userIds),
					eq(userAssignmentsTable.locationId, locationId),
				),
			)
	}

	/** Update role for multiple users in a location in a single query */
	async updateRoleBulkByLocation(
		userIds: number[],
		locationId: number,
		roleId: number,
		actorId: ActorId,
	): Promise<void> {
		await this.db
			.update(userAssignmentsTable)
			.set({
				roleId,
				addedBy: actorId,
			})
			.where(
				and(
					inArray(userAssignmentsTable.userId, userIds),
					eq(userAssignmentsTable.locationId, locationId),
				),
			)
	}

	/**
	 * Replace assignments for multiple users in a single transaction.
	 * Deletes all existing assignments for these users, then inserts new ones.
	 */
	async replaceBulkByUserIds(
		userIds: number[],
		assignmentsByUserId: Map<number, UserAssignmentUpsertSchema[]>,
		actorId: ActorId,
	): Promise<void> {
		await this.db.transaction(async (tx) => {
			await tx.delete(userAssignmentsTable).where(inArray(userAssignmentsTable.userId, userIds))

			const valuesToInsert: (typeof userAssignmentsTable.$inferInsert)[] = []
			for (const userId of userIds) {
				const assignments = assignmentsByUserId.get(userId) ?? []
				for (const a of assignments) {
					valuesToInsert.push({
						userId,
						roleId: a.roleId,
						locationId: a.locationId,
						addedAt: new Date(),
						addedBy: actorId,
					})
				}
			}

			if (valuesToInsert.length > 0) {
				await tx.insert(userAssignmentsTable).values(valuesToInsert)
			}
		})
	}
}

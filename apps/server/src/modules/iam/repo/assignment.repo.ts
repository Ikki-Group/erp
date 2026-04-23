import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, inArray } from 'drizzle-orm'

import { paginate, sortBy, type WithPaginationResult } from '@/core/database'

import { db } from '@/db'
import { userAssignmentsTable } from '@/db/schema'

import * as dto from '../dto'
import type { OmitPaginationQuery } from '@/types/utils'

export class UserAssignmentRepo {
	/* -------------------------------------------------------------------------- */
	/*                                    QUERY                                   */
	/* -------------------------------------------------------------------------- */

	async getList(
		filter: OmitPaginationQuery<dto.UserAssignmentFilterDto>,
	): Promise<dto.UserAssignmentDto[]> {
		return record('UserAssignmentRepo.getList', async () => {
			const where = this.buildWhereClause(filter)
			return db.select().from(userAssignmentsTable).where(where)
		})
	}

	async getListPaginated(
		filter: dto.UserAssignmentFilterDto,
	): Promise<WithPaginationResult<dto.UserAssignmentDto>> {
		return record('UserAssignmentRepo.getListPaginated', async () => {
			const where = this.buildWhereClause(filter)
			const { page, limit } = filter

			return paginate<dto.UserAssignmentDto>({
				data: ({ limit: l, offset }) =>
					db
						.select()
						.from(userAssignmentsTable)
						.where(where)
						.orderBy(sortBy(userAssignmentsTable.addedAt, 'desc'))
						.limit(l)
						.offset(offset),
				pq: { page, limit },
				countQuery: db.select({ count: count() }).from(userAssignmentsTable).where(where),
			})
		})
	}

	/* -------------------------------------------------------------------------- */
	/*                                  MUTATION                                  */
	/* -------------------------------------------------------------------------- */

	async replaceBulkByUserId(
		userId: number,
		assignments: dto.UserAssignmentUpsertDto[],
		actorId: number,
	): Promise<void> {
		return record('UserAssignmentRepo.replaceBulkByUserId', async () => {
			await db.transaction(async (tx) => {
				await tx.delete(userAssignmentsTable).where(eq(userAssignmentsTable.userId, userId))
				await tx.insert(userAssignmentsTable).values(
					assignments.map((a) => ({
						userId,
						roleId: a.roleId,
						locationId: a.locationId,
						addedAt: new Date(),
						addedBy: actorId,
					})),
				)
			})
		})
	}

	async removeByUserAndLocation(userId: number, locationId: number): Promise<void> {
		return record('UserAssignmentRepo.removeByUserAndLocation', async () => {
			await db
				.delete(userAssignmentsTable)
				.where(
					and(
						eq(userAssignmentsTable.userId, userId),
						eq(userAssignmentsTable.locationId, locationId),
					),
				)
		})
	}

	/**
	 * Remove multiple users from a location in a single query
	 */
	async removeUsersBulkFromLocation(userIds: number[], locationId: number): Promise<void> {
		return record('UserAssignmentRepo.removeUsersBulkFromLocation', async () => {
			await db
				.delete(userAssignmentsTable)
				.where(
					and(
						inArray(userAssignmentsTable.userId, userIds),
						eq(userAssignmentsTable.locationId, locationId),
					),
				)
		})
	}

	/**
	 * Get assignments for multiple users in a single query
	 */
	async getListByUserIds(userIds: number[]): Promise<dto.UserAssignmentDto[]> {
		return record('UserAssignmentRepo.getListByUserIds', async () => {
			return db
				.select()
				.from(userAssignmentsTable)
				.where(inArray(userAssignmentsTable.userId, userIds))
		})
	}

	/**
	 * Update role for multiple users in a location in a single query
	 */
	async updateRoleBulkByLocation(
		userIds: number[],
		locationId: number,
		roleId: number,
		actorId: number,
	): Promise<void> {
		return record('UserAssignmentRepo.updateRoleBulkByLocation', async () => {
			await db
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
		})
	}

	/**
	 * Replace assignments for multiple users in a single transaction
	 * Deletes all existing assignments for these users, then inserts new ones
	 */
	async replaceBulkByUserIds(
		userIds: number[],
		assignmentsByUserId: Map<number, dto.UserAssignmentUpsertDto[]>,
		actorId: number,
	): Promise<void> {
		return record('UserAssignmentRepo.replaceBulkByUserIds', async () => {
			await db.transaction(async (tx) => {
				// Delete all assignments for all users in one query
				await tx.delete(userAssignmentsTable).where(inArray(userAssignmentsTable.userId, userIds))

				// Build and insert all new assignments in one query
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
		})
	}

	/* -------------------------------------------------------------------------- */
	/*                                  PRIVATE                                   */
	/* -------------------------------------------------------------------------- */

	private buildWhereClause(
		filter: Partial<Pick<dto.UserAssignmentFilterDto, 'userId' | 'roleId' | 'locationId'>>,
	) {
		const { userId, roleId, locationId } = filter
		return and(
			userId ? eq(userAssignmentsTable.userId, userId) : undefined,
			roleId ? eq(userAssignmentsTable.roleId, roleId) : undefined,
			locationId ? eq(userAssignmentsTable.locationId, locationId) : undefined,
		)
	}
}

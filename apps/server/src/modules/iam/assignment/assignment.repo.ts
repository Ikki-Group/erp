import { and, eq, inArray } from 'drizzle-orm'

import { userAssignmentsTable } from '@/db/schema'

import { type DbClient } from '@/infra/database'

import type { ActorId } from '@/types/utils'

import type { UserAssignmentSchema, UserAssignmentUpsertSchema } from './assignment.schema'

export class UserAssignmentRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getList(): Promise<UserAssignmentSchema[]> {
		return this.db.select().from(userAssignmentsTable)
	}

	/** Get assignments for multiple users in a single query */
	async getListByUserIds(userIds: number[]): Promise<UserAssignmentSchema[]> {
		return this.db
			.select()
			.from(userAssignmentsTable)
			.where(inArray(userAssignmentsTable.userId, userIds))
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async replaceByUserId(
		userId: number,
		assignments: ({ id?: number } & Pick<UserAssignmentSchema, 'roleId' | 'locationId'>)[],
	) {}

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

import { eq, inArray, and, type SQL } from 'drizzle-orm'

import { userAssignmentsTable } from '@/db/schema'

import { type DbClient } from '@/infra/database'

import type { ActorId } from '@/types/utils'

import type { UserAssignmentSchema, UserAssignmentUpsertSchema } from './assignment.schema'

type GetUserAssignmentListOptions = {
	userIds?: number | number[]
	roleIds?: number | number[]
	locationIds?: number | number[]
}

export class UserAssignmentRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	/**
	 * List all
	 * should filter by
	 * userIds?: Array<number> | number
	 * roleIds?: Array<number> | number
	 */
	async getList(options: GetUserAssignmentListOptions = {}): Promise<UserAssignmentSchema[]> {
		const conditions: SQL[] = []

		if (options.userIds) {
			conditions.push(
				inArray(
					userAssignmentsTable.userId,
					Array.isArray(options.userIds) ? options.userIds : [options.userIds],
				),
			)
		}

		if (options.roleIds) {
			conditions.push(
				inArray(
					userAssignmentsTable.roleId,
					Array.isArray(options.roleIds) ? options.roleIds : [options.roleIds],
				),
			)
		}

		if (options.locationIds) {
			conditions.push(
				inArray(
					userAssignmentsTable.locationId,
					Array.isArray(options.locationIds) ? options.locationIds : [options.locationIds],
				),
			)
		}

		return this.db
			.select()
			.from(userAssignmentsTable)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
	}

	/* -------------------------------- MUTATION -------------------------------- */

	/**
	 * Replaces all assignments for the specified user.
	 */
	async replaceByUserId(
		userId: number,
		assignments: UserAssignmentUpsertSchema[],
		actorId: ActorId,
	): Promise<void> {
		const now = new Date()

		await this.db.transaction(async (tx) => {
			await tx.delete(userAssignmentsTable).where(eq(userAssignmentsTable.userId, userId))

			if (assignments.length === 0) {
				return
			}

			await tx.insert(userAssignmentsTable).values(
				assignments.map((assignment) => ({
					userId,
					roleId: assignment.roleId,
					locationId: assignment.locationId,
					createdAt: now,
					updatedAt: now,
					createdBy: actorId,
					updatedBy: actorId,
				})),
			)
		})
	}
}

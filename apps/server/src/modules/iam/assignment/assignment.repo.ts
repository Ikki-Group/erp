import { eq, inArray, and, type SQL } from 'drizzle-orm'

import { userAssignmentsTable } from '@/db/schema'

import { type DbContext } from '@/infra/database'
import { toArray } from '@/shared/utils'

import type { ActorId } from '@/types/utils'

import type { UserAssignmentSchema, UserAssignmentUpsertSchema } from './assignment.schema'

interface FindManyOpts {
	userIds?: number | number[]
	roleIds?: number | number[]
	locationIds?: number | number[]
}

export class UserAssignmentRepo {
	constructor(private readonly db: DbContext) {}

	async findMany(opts: FindManyOpts = {}, db = this.db): Promise<UserAssignmentSchema[]> {
		const { userIds, roleIds, locationIds } = opts
		const conditions: SQL[] = []

		if (userIds) conditions.push(inArray(userAssignmentsTable.userId, toArray(userIds)))
		if (roleIds) conditions.push(inArray(userAssignmentsTable.roleId, toArray(roleIds)))
		if (locationIds) conditions.push(inArray(userAssignmentsTable.locationId, toArray(locationIds)))

		return db
			.select()
			.from(userAssignmentsTable)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
	}

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

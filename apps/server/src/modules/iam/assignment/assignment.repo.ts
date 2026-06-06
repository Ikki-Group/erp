import { eq, inArray, and, type SQL } from 'drizzle-orm'

import { userAssignmentsTable } from '@/db/schema'

import { type DbClient } from '@/infra/database'

import type { ActorId } from '@/types/utils'

import type { UserAssignmentSchema } from './assignment.schema'

type GetUserAssignmentListOptions = {
	userIds?: number | number[]
	roleIds?: number | number[]
	locationIds?: number | number[]
}

type UserAssignmentSyncInput = {
	id?: number
	roleId: number
	locationId: number
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
	 * Synchronizes all user assignments.
	 *
	 * Existing assignments will be created, updated, or removed
	 * to match the provided assignment list.
	 */
	async syncByUserId(
		userId: number,
		assignments: UserAssignmentSyncInput[],
		actorId: ActorId,
	): Promise<void> {
		const now = new Date()
		await this.db.transaction(async (tx) => {
			const currentAssignments = await tx
				.select()
				.from(userAssignmentsTable)
				.where(eq(userAssignmentsTable.userId, userId))

			const currentAssignmentMap = new Map(
				currentAssignments.map((assignment) => [assignment.id, assignment]),
			)

			const incomingIds = new Set(
				assignments
					.map((assignment) => assignment.id)
					.filter((id): id is number => id !== undefined),
			)

			const assignmentIdsToDelete = currentAssignments
				.filter((assignment) => !incomingIds.has(assignment.id))
				.map((assignment) => assignment.id)

			if (assignmentIdsToDelete.length > 0) {
				await tx
					.delete(userAssignmentsTable)
					.where(inArray(userAssignmentsTable.id, assignmentIdsToDelete))
			}

			const assignmentsToCreate = assignments.filter((assignment) => assignment.id === undefined)

			if (assignmentsToCreate.length > 0) {
				await tx.insert(userAssignmentsTable).values(
					assignmentsToCreate.map((assignment) => ({
						userId,
						roleId: assignment.roleId,
						locationId: assignment.locationId,
						createdBy: actorId,
						updatedBy: actorId,
					})),
				)
			}

			for (const assignment of assignments) {
				if (!assignment.id) continue

				const currentAssignment = currentAssignmentMap.get(assignment.id)

				if (!currentAssignment) continue

				const hasChanges =
					currentAssignment.roleId !== assignment.roleId ||
					currentAssignment.locationId !== assignment.locationId

				if (!hasChanges) continue

				await tx
					.update(userAssignmentsTable)
					.set({
						roleId: assignment.roleId,
						locationId: assignment.locationId,
						addedBy: actorId,
						addedAt: now,
					})
					.where(eq(userAssignmentsTable.id, assignment.id))
			}
		})
	}
}

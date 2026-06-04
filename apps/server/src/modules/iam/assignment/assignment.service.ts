import { record } from '@elysiajs/opentelemetry'

import type { OmitPaginationQuery } from '@/types/utils'
import type { ActorId } from '@/types/utils'

import { IAM_CONFIG, SYSTEM_ROLES } from '../constants'
import { UserAssignmentRepo } from './assignment.repo'
import type { UserAssignmentSchema, UserAssignmentUpsertSchema } from './assignment.schema'
import type { UserAssignmentFilterSchema } from './assignment.schema'

export class UserAssignmentService {
	constructor(private readonly repo: UserAssignmentRepo) {}

	/* --------------------------------- PUBLIC --------------------------------- */

	getDefaultAssignmentForSuperadmin(): UserAssignmentSchema {
		const now = new Date()
		return {
			id: IAM_CONFIG.SUPERADMIN_PLACEHOLDER_ID,
			userId: IAM_CONFIG.SUPERADMIN_PLACEHOLDER_ID,
			roleId: SYSTEM_ROLES.SUPERADMIN_ID,
			locationId: IAM_CONFIG.SUPERADMIN_PLACEHOLDER_ID,
			addedAt: now,
			addedBy: IAM_CONFIG.SUPERADMIN_PLACEHOLDER_ID,
		}
	}

	/**
	 * Get assignments for a single user — cached.
	 * Used internally by UserService and externally by router.
	 */
	async findByUserId(userId: number): Promise<UserAssignmentSchema[]> {
		return this.repo.getList({ userId })
	}

	async handleGetList(
		filter: OmitPaginationQuery<UserAssignmentFilterSchema>,
	): Promise<UserAssignmentSchema[]> {
		return this.repo.getList(filter)
	}

	async handleGetListPaginated(filter: UserAssignmentFilterSchema) {
		return this.repo.getListPaginated(filter)
	}

	async getListByUserIds(userIds: number[]): Promise<Record<number, UserAssignmentSchema[]>> {
		return record('UserAssignmentService.getListByUserIds', async () => {
			if (userIds.length === 0) return {}
			const assignments = await this.repo.getListByUserIds(userIds)
			return assignments.reduce<Record<number, UserAssignmentSchema[]>>((acc, a) => {
				acc[a.userId] ??= acc[a.userId] ?? []
				acc[a.userId]!.push(a)
				return acc
			}, {})
		})
	}

	/* ========================================================================== */
	/*                              COMMAND OPERATIONS                           */
	/* ========================================================================== */

	async handleReplaceBulkByUserId(
		userId: number,
		assignments: UserAssignmentUpsertSchema[],
		actorId: ActorId,
	): Promise<void> {
		await this.repo.replaceBulkByUserId(userId, assignments, actorId)
	}

	async handleAssignToLocation(
		data: Omit<UserAssignmentUpsertSchema, 'isDefault'>,
		actorId: ActorId,
	): Promise<void> {
		const existingAssignments = await this.repo.getList({ userId: data.userId })
		const existingIndex = existingAssignments.findIndex((a) => a.locationId === data.locationId)

		const newAssignments: UserAssignmentUpsertSchema[] = existingAssignments.map((a) => ({
			userId: a.userId,
			roleId: a.roleId,
			locationId: a.locationId,
		}))

		if (existingIndex === -1) {
			newAssignments.push({
				userId: data.userId,
				roleId: data.roleId,
				locationId: data.locationId,
			})
		} else {
			newAssignments[existingIndex] = {
				userId: data.userId,
				roleId: data.roleId,
				locationId: data.locationId,
			}
		}

		await this.repo.replaceBulkByUserId(data.userId, newAssignments, actorId)
	}

	async handleRemoveFromLocation(userId: number, locationId: number): Promise<void> {
		await this.repo.removeByUserAndLocation(userId, locationId)
	}

	/** Remove multiple users from a location with single query */
	async handleRemoveUsersFromLocation(userIds: number[], locationId: number): Promise<void> {
		await this.repo.removeUsersBulkFromLocation(userIds, locationId)
	}

	/** Assign multiple users to a location with same role */
	async handleAssignUsersToLocation(
		userIds: number[],
		locationId: number,
		roleId: number,
		actorId: ActorId,
	): Promise<void> {
		const existingAssignments = await this.repo.getListByUserIds(userIds)

		const assignmentsByUserId = new Map<number, UserAssignmentUpsertSchema[]>()
		for (const userId of userIds) {
			const userAssignments = existingAssignments.filter((a) => a.userId === userId)
			const hasLocationAssignment = userAssignments.some((a) => a.locationId === locationId)

			const newAssignments: UserAssignmentUpsertSchema[] = userAssignments.map((a) => ({
				userId: a.userId,
				roleId: a.roleId,
				locationId: a.locationId,
			}))

			if (!hasLocationAssignment) {
				newAssignments.push({ userId, roleId, locationId })
			}

			assignmentsByUserId.set(userId, newAssignments)
		}

		await this.repo.replaceBulkByUserIds(userIds, assignmentsByUserId, actorId)
	}

	/** Update role for multiple users in a location with single query */
	async handleUpdateRoleForUsersInLocation(
		userIds: number[],
		locationId: number,
		roleId: number,
		actorId: ActorId,
	): Promise<void> {
		await this.repo.updateRoleBulkByLocation(userIds, locationId, roleId, actorId)
	}
}

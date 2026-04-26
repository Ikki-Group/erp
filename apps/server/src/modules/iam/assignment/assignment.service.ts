import { record } from '@elysiajs/opentelemetry'

import { bento } from '@/core/cache'
import type { OmitPaginationQuery } from '@/types/utils'

import { IAM_CACHE_KEYS, IAM_CONFIG, SYSTEM_ROLES } from '../constants'
import * as dto from './assignment.dto'
import { UserAssignmentRepo } from './assignment.repo'

const cache = bento.namespace('assignment')

export class UserAssignmentService {
	constructor(private repo = new UserAssignmentRepo()) {}

	/* ========================================================================== */
	/*                              CACHE MANAGEMENT                             */
	/* ========================================================================== */

	private async invalidateUsersCaches(userIds: number[]): Promise<void> {
		const keys = userIds.map((id) => IAM_CACHE_KEYS.ASSIGNMENT_BY_USER(id))
		await cache.deleteMany({ keys })
	}

	/* ========================================================================== */
	/*                              QUERY OPERATIONS                             */
	/* ========================================================================== */

	getDefaultAssignmentForSuperadmin(): dto.UserAssignmentDto {
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
	async findByUserId(userId: number): Promise<dto.UserAssignmentDto[]> {
		return record('UserAssignmentService.findByUserId', async () => {
			return cache.getOrSet({
				key: IAM_CACHE_KEYS.ASSIGNMENT_BY_USER(userId),
				factory: async () => this.repo.getList({ userId }),
			})
		})
	}

	async handleGetList(
		filter: OmitPaginationQuery<dto.UserAssignmentFilterDto>,
	): Promise<dto.UserAssignmentDto[]> {
		return record('UserAssignmentService.handleGetList', async () => {
			return this.repo.getList(filter)
		})
	}

	async handleGetListPaginated(filter: dto.UserAssignmentFilterDto) {
		return record('UserAssignmentService.handleGetListPaginated', async () => {
			return this.repo.getListPaginated(filter)
		})
	}

	/* ========================================================================== */
	/*                              COMMAND OPERATIONS                           */
	/* ========================================================================== */

	async handleReplaceBulkByUserId(
		userId: number,
		assignments: dto.UserAssignmentUpsertDto[],
		actorId: number,
	): Promise<void> {
		return record('UserAssignmentService.handleReplaceBulkByUserId', async () => {
			await this.repo.replaceBulkByUserId(userId, assignments, actorId)
			await this.invalidateUsersCaches([userId])
		})
	}

	async handleAssignToLocation(
		data: Omit<dto.UserAssignmentUpsertDto, 'isDefault'>,
		actorId: number,
	): Promise<void> {
		return record('UserAssignmentService.handleAssignToLocation', async () => {
			const existingAssignments = await this.repo.getList({ userId: data.userId })
			const existingIndex = existingAssignments.findIndex((a) => a.locationId === data.locationId)

			const newAssignments: dto.UserAssignmentUpsertDto[] = existingAssignments.map((a) => ({
				userId: a.userId,
				roleId: a.roleId,
				locationId: a.locationId,
			}))

			if (existingIndex === -1) {
				newAssignments.push({ userId: data.userId, roleId: data.roleId, locationId: data.locationId })
			} else {
				newAssignments[existingIndex] = {
					userId: data.userId,
					roleId: data.roleId,
					locationId: data.locationId,
				}
			}

			await this.repo.replaceBulkByUserId(data.userId, newAssignments, actorId)
			await this.invalidateUsersCaches([data.userId])
		})
	}

	async handleRemoveFromLocation(userId: number, locationId: number): Promise<void> {
		return record('UserAssignmentService.handleRemoveFromLocation', async () => {
			await this.repo.removeByUserAndLocation(userId, locationId)
			await this.invalidateUsersCaches([userId])
		})
	}

	/** Remove multiple users from a location with single query */
	async handleRemoveUsersFromLocation(userIds: number[], locationId: number): Promise<void> {
		return record('UserAssignmentService.handleRemoveUsersFromLocation', async () => {
			await this.repo.removeUsersBulkFromLocation(userIds, locationId)
			await this.invalidateUsersCaches(userIds)
		})
	}

	/** Assign multiple users to a location with same role */
	async handleAssignUsersToLocation(
		userIds: number[],
		locationId: number,
		roleId: number,
		actorId: number,
	): Promise<void> {
		return record('UserAssignmentService.handleAssignUsersToLocation', async () => {
			const existingAssignments = await this.repo.getListByUserIds(userIds)

			const assignmentsByUserId = new Map<number, dto.UserAssignmentUpsertDto[]>()
			for (const userId of userIds) {
				const userAssignments = existingAssignments.filter((a) => a.userId === userId)
				const hasLocationAssignment = userAssignments.some((a) => a.locationId === locationId)

				const newAssignments: dto.UserAssignmentUpsertDto[] = userAssignments.map((a) => ({
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
			await this.invalidateUsersCaches(userIds)
		})
	}

	/** Update role for multiple users in a location with single query */
	async handleUpdateRoleForUsersInLocation(
		userIds: number[],
		locationId: number,
		roleId: number,
		actorId: number,
	): Promise<void> {
		return record('UserAssignmentService.handleUpdateRoleForUsersInLocation', async () => {
			await this.repo.updateRoleBulkByLocation(userIds, locationId, roleId, actorId)
			await this.invalidateUsersCaches(userIds)
		})
	}
}

import { record } from '@elysiajs/opentelemetry'

import * as dto from '../dto/assignment.dto'
import type { UserAssignmentService } from '../service/assignment.service'
import type { OmitPaginationQuery } from '@/types/utils'

export class AssignmentUsecases {
	constructor(private assignmentService: UserAssignmentService) {}

	async handleGetList(
		filter: OmitPaginationQuery<dto.UserAssignmentFilterDto>,
	): Promise<dto.UserAssignmentDto[]> {
		return record('AssignmentUsecases.handleGetList', async () => {
			return this.assignmentService.repo.getList(filter)
		})
	}

	async handleGetListPaginated(filter: dto.UserAssignmentFilterDto) {
		return record('AssignmentUsecases.handleGetListPaginated', async () => {
			return this.assignmentService.repo.getListPaginated(filter)
		})
	}

	async handleGetByUserId(userId: number): Promise<dto.UserAssignmentDto[]> {
		return record('AssignmentUsecases.handleGetByUserId', async () => {
			return this.assignmentService.findByUserId(userId)
		})
	}

	async handleReplaceBulkByUserId(
		userId: number,
		assignments: dto.UserAssignmentUpsertDto[],
		actorId: number,
	): Promise<void> {
		return record('AssignmentUsecases.handleReplaceBulkByUserId', async () => {
			await this.assignmentService.repo.replaceBulkByUserId(userId, assignments, actorId)
			await this.assignmentService.invalidateUsersCaches([userId])
		})
	}

	async handleAssignToLocation(
		data: Omit<dto.UserAssignmentUpsertDto, 'isDefault'>,
		actorId: number,
	): Promise<void> {
		return record('AssignmentUsecases.handleAssignToLocation', async () => {
			const existingAssignments = await this.assignmentService.repo.getList({ userId: data.userId })
			const existingIndex = existingAssignments.findIndex((a) => a.locationId === data.locationId)

			const newAssignments: dto.UserAssignmentUpsertDto[] = existingAssignments.map((a) => ({
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

			await this.assignmentService.repo.replaceBulkByUserId(data.userId, newAssignments, actorId)
			await this.assignmentService.invalidateUsersCaches([data.userId])
		})
	}

	async handleRemoveFromLocation(userId: number, locationId: number): Promise<void> {
		return record('AssignmentUsecases.handleRemoveFromLocation', async () => {
			await this.assignmentService.repo.removeByUserAndLocation(userId, locationId)
			await this.assignmentService.invalidateUsersCaches([userId])
		})
	}

	async handleRemoveUsersFromLocation(userIds: number[], locationId: number): Promise<void> {
		return record('AssignmentUsecases.handleRemoveUsersFromLocation', async () => {
			await this.assignmentService.repo.removeUsersBulkFromLocation(userIds, locationId)
			await this.assignmentService.invalidateUsersCaches(userIds)
		})
	}

	async handleAssignUsersToLocation(
		userIds: number[],
		locationId: number,
		roleId: number,
		actorId: number,
	): Promise<void> {
		return record('AssignmentUsecases.handleAssignUsersToLocation', async () => {
			const existingAssignments = await this.assignmentService.repo.getListByUserIds(userIds)

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
					newAssignments.push({
						userId,
						roleId,
						locationId,
					})
				}

				assignmentsByUserId.set(userId, newAssignments)
			}

			await this.assignmentService.repo.replaceBulkByUserIds(userIds, assignmentsByUserId, actorId)
			await this.assignmentService.invalidateUsersCaches(userIds)
		})
	}

	async handleUpdateRoleForUsersInLocation(
		userIds: number[],
		locationId: number,
		roleId: number,
		actorId: number,
	): Promise<void> {
		return record('AssignmentUsecases.handleUpdateRoleForUsersInLocation', async () => {
			await this.assignmentService.repo.updateRoleBulkByLocation(userIds, locationId, roleId, actorId)
			await this.assignmentService.invalidateUsersCaches(userIds)
		})
	}
}

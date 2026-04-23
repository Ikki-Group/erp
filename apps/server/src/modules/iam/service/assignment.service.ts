import { record } from '@elysiajs/opentelemetry'

import { IAM_CONFIG, SYSTEM_ROLES } from '../constants'
import * as dto from '../dto/assignment.dto'
import { UserAssignmentRepo } from '../repo/assignment.repo'
import type { OmitPaginationQuery } from '@/types/utils'

// User Assignment Service (Layer 1)
// Handles user location and role assignments
// Methods organized by QUERY (read) and COMMAND (write) operations
export class UserAssignmentService {
	constructor(public repo = new UserAssignmentRepo()) {}

	/* ========================================================================== */
	/*                              QUERY OPERATIONS                             */
	/* ========================================================================== */

	private getDefaultAssignmentForSuperadminInternal(): dto.UserAssignmentDto {
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

	getDefaultAssignmentForSuperadmin(): dto.UserAssignmentDto {
		return this.getDefaultAssignmentForSuperadminInternal()
	}

	async findByUserId(userId: number): Promise<dto.UserAssignmentDto[]> {
		return record('UserAssignmentService.findByUserId', async () => {
			return this.repo.getList({ userId })
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

	async handleGetByUserId(userId: number): Promise<dto.UserAssignmentDto[]> {
		return record('UserAssignmentService.handleGetByUserId', async () => {
			return this.repo.getList({ userId })
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
		})
	}

	async handleRemoveFromLocation(userId: number, locationId: number): Promise<void> {
		return record('UserAssignmentService.handleRemoveFromLocation', async () => {
			await this.repo.removeByUserAndLocation(userId, locationId)
		})
	}
}

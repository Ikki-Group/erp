import { record } from '@elysiajs/opentelemetry'

import * as dto from '../dto/assignment.dto'
import { UserAssignmentRepo } from '../repo/assignment.repo'
import type { OmitPaginationQuery } from '@/types/utils'

const SUPERADMIN_ROLE_ID = 1
const PLACEHOLDER_ID = 999999

// User Assignment Service (Layer 0)
export class UserAssignmentService {
	constructor(public repo = new UserAssignmentRepo()) {}

	getDefaultAssignmentForSuperadmin(): dto.UserAssignmentDto {
		const now = new Date()
		return {
			id: PLACEHOLDER_ID,
			userId: PLACEHOLDER_ID,
			roleId: SUPERADMIN_ROLE_ID,
			locationId: PLACEHOLDER_ID,
			isDefault: true,
			createdAt: now,
			updatedAt: now,
			createdBy: PLACEHOLDER_ID,
			updatedBy: PLACEHOLDER_ID,
			deletedAt: null,
			deletedBy: null,
		}
	}

	async getList(
		filter: OmitPaginationQuery<dto.UserAssignmentFilterDto>,
	): Promise<dto.UserAssignmentDto[]> {
		return record('UserAssignmentService.getList', async () => {
			return this.repo.getList(filter)
		})
	}

	async updateByUserId(
		userId: number,
		assignments: Omit<dto.UserAssignmentUpsertDto, 'userId'>[],
		actorId: number,
	): Promise<void> {
		return record('UserAssignmentService.updateByUserId', async () => {
			const existingAssignments = await this.repo.getList({ userId })
			// const newAssignments: dto.UserAssignmentUpsertDto[] =
		})
	}

	async execUpsertBulk(
		userId: number,
		assignments: dto.UserAssignmentUpsertDto[],
		actorId: number,
	): Promise<void> {
		return record('UserAssignmentService.execUpsertBulk', async () => {
			await this.repo.upsertBulk(userId, assignments, actorId)
		})
	}

	async findByUserId(userId: number): Promise<dto.UserAssignmentDto[]> {
		return record('UserAssignmentService.findByUserId', async () => {
			return this.repo.getList({ userId })
		})
	}

	async handleList(filter: dto.UserAssignmentFilterDto) {
		return record('UserAssignmentService.handleList', async () => {
			return this.repo.getListPaginated(filter)
		})
	}

	async execAssign(data: Omit<dto.UserAssignmentUpsertDto, 'isDefault'>, actorId: number) {
		return record('UserAssignmentService.execAssign', async () => {
			const existingAssignments = await this.repo.getList({ userId: data.userId })
			const existingIndex = existingAssignments.findIndex((a) => a.locationId === data.locationId)

			const newAssignments: dto.UserAssignmentUpsertDto[] = existingAssignments.map((a) => ({
				userId: a.userId,
				roleId: a.roleId,
				locationId: a.locationId,
				isDefault: a.isDefault,
			}))

			// oxlint-disable-next-line no-negated-condition
			if (existingIndex !== -1) {
				const target = newAssignments[existingIndex]
				if (target) {
					newAssignments[existingIndex] = {
						userId: data.userId,
						roleId: data.roleId,
						locationId: data.locationId,
						isDefault: target.isDefault,
					}
				}
			} else {
				newAssignments.push({
					userId: data.userId,
					roleId: data.roleId,
					locationId: data.locationId,
					isDefault: newAssignments.length === 0,
				})
			}
			await this.repo.upsertBulk(data.userId, newAssignments, actorId)
		})
	}

	async execRemove(userId: number, locationId: number) {
		return record('UserAssignmentService.execRemove', async () => {
			await this.repo.remove(userId, locationId)
		})
	}
}

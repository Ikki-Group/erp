import { record } from '@elysiajs/opentelemetry'

import * as dto from '../dto/assignment.dto'
import { UserAssignmentRepo } from '../repo/assignment.repo'

// const cache = bento.namespace('user-assignment')

const SUPERADMIN_ROLE_ID = 1
const PLACEHOLDER_ID = 999999

// User Assignment Service (Layer 0)
export class UserAssignmentService {
	private repo = new UserAssignmentRepo()

	// public
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

	async getList(filter: dto.UserAssignmentFilterDto): Promise<dto.UserAssignmentDto[]> {
		return record('UserAssignmentService.getList', async () => {
			return this.repo.getList(filter)
		})
	}
}

import { record } from '@elysiajs/opentelemetry'

import { bento } from '@/core/cache'

import { IAM_CONFIG, SYSTEM_ROLES, IAM_CACHE_KEYS } from '../constants'
import * as dto from '../dto/assignment.dto'
import { UserAssignmentRepo } from '../repo/assignment.repo'

const cache = bento.namespace('assignment')

// User Assignment Service (Layer 1)
// Handles user location and role assignments
// Pure Domain Service
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
			return cache.getOrSet({
				key: IAM_CACHE_KEYS.ASSIGNMENT_BY_USER(userId),
				factory: async () => this.repo.getList({ userId }),
			})
		})
	}

	/* ========================================================================== */
	/*                              CACHE OPERATIONS                             */
	/* ========================================================================== */

	public async invalidateUsersCaches(userIds: number[]): Promise<void> {
		const keys = userIds.map((id) => IAM_CACHE_KEYS.ASSIGNMENT_BY_USER(id))
		await cache.deleteMany({ keys })
	}
}

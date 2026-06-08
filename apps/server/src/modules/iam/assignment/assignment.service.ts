import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'

import type { ActorId } from '@/types/utils'

import { IAM_CONFIG, SYSTEM_ROLES } from '../constants'
import { UserAssignmentRepo } from './assignment.repo'
import type { UserAssignmentSchema, UserAssignmentUpsertSchema } from './assignment.schema'

export class UserAssignmentService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: UserAssignmentRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'iam.user.assignment')
	}

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

	async getByUserId(userId: number): Promise<UserAssignmentSchema[]> {
		return record('UserAssignmentService.getByUserId', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.byId(userId),
				factory: () => this.repo.getList({ userIds: userId }),
			}),
		)
	}

	async getRecordByUserId(userIds: number[]): Promise<Record<number, UserAssignmentSchema[]>> {
		const result: Record<number, UserAssignmentSchema[]> = {}
		await Promise.all(userIds.map((id) => this.getByUserId(id).then((r) => (result[id] = r))))
		return result
	}

	/* ========================================================================== */
	/*                              COMMAND OPERATIONS                           */
	/* ========================================================================== */

	async replaceByUserId(
		userId: number,
		assignments: UserAssignmentUpsertSchema[],
		actorId: ActorId,
	): Promise<void> {
		return record('UserAssignmentService.replaceByUserId', async () =>
			this.repo.replaceByUserId(userId, assignments, actorId),
		)
	}
}

import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'
import type { ActorId } from '@/shared/types/utils'

import { IAM_CONFIG, SYSTEM_ROLES } from '../constants'
import type { UserAssignmentDto } from './assignment.contract'
import type { IUserAssignmentRepo } from './assignment.repo'

export class UserAssignmentService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IUserAssignmentRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'iam.user.assignment')
	}

	getDefaultAssignmentForSuperadmin(): UserAssignmentDto {
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

	async getByUserId(userId: number): Promise<UserAssignmentDto[]> {
		return record('UserAssignmentService.getByUserId', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.byId(userId),
				factory: () => this.repo.findMany({ userIds: userId }),
			}),
		)
	}

	/**
	 * Batch-load assignments for many users in a single query (no N+1), grouped
	 * by userId. Every requested id is present in the result (empty array when
	 * the user has no assignments).
	 */
	async getRecordByUserId(userIds: number[]): Promise<Record<number, UserAssignmentDto[]>> {
		return record('UserAssignmentService.getRecordByUserId', async () => {
			const result: Record<number, UserAssignmentDto[]> = {}
			for (const id of userIds) result[id] = []
			if (userIds.length === 0) return result

			const rows = await this.repo.findMany({ userIds })
			for (const row of rows) {
				;(result[row.userId] ??= []).push(row)
			}
			return result
		})
	}

	async replaceByUserId(
		userId: number,
		assignments: {
			roleId: number
			locationId: number
		}[],
		actorId: ActorId,
		db?: DbContext,
	): Promise<void> {
		return record('UserAssignmentService.replaceByUserId', async () => {
			const now = new Date()
			await this.repo.replaceByUserId(
				userId,
				assignments.map((a) => ({
					...a,
					userId,
					addedAt: now,
					addedBy: actorId,
				})),
				db,
			)

			// Invalidate cache for this user's assignments
			await this.cache.deleteFromKeys([this.cache.keys.byId(userId)])
		})
	}
}

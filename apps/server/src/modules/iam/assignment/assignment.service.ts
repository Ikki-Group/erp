import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'
import type { ActorId } from '@/shared/types/utils'

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

	async getByUserId(userId: number): Promise<UserAssignmentDto[]> {
		return record('UserAssignmentService.getByUserId', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.byId(userId),
				factory: () => this.repo.findMany({ userIds: userId }),
			}),
		)
	}

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

			await this.cache.deleteFromKeys([this.cache.keys.byId(userId)])
		})
	}
}

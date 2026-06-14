import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'

import type { ActorId } from '@/types/utils'

import { IAM_CONFIG, SYSTEM_ROLES } from '../constants'
import type { UserAssignmentDto } from './assignment.contract'
import { UserAssignmentRepo } from './assignment.repo'

export class UserAssignmentService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: UserAssignmentRepo,
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

	async getRecordByUserId(userIds: number[]): Promise<Record<number, UserAssignmentDto[]>> {
		const result: Record<number, UserAssignmentDto[]> = {}
		await Promise.all(userIds.map((id) => this.getByUserId(id).then((r) => (result[id] = r))))
		return result
	}

	async replaceByUserId(
		userId: number,
		assignments: {
			roleId: number
			locationId: number
		}[],
		actorId: ActorId,
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
			)
		})
	}
}

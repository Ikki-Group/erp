import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'
import type { EntityRef } from '@/shared/types/utils'

import type {
	MokaProvider,
	MokaScrapStatus,
	MokaScrapType,
	MokaSyncTriggerMode,
} from '../shared.contract'
import * as dto from './scrap-history.contract'
import { MokaScrapHistoryError } from './scrap-history.internal'
import type { IMokaScrapHistoryRepo } from './scrap-history.repo'

export class MokaScrapHistoryService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IMokaScrapHistoryRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'moka.scrap-history')
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async create(
		data: {
			mokaConfigurationId: number
			provider?: MokaProvider
			type: MokaScrapType
			triggerMode?: MokaSyncTriggerMode
			dateFrom: Date
			dateTo: Date
			status?: MokaScrapStatus
		},
		actorId: number,
	): Promise<EntityRef> {
		return record('MokaScrapHistoryService.create', async () => {
			const result = await this.repo.create(data, actorId)
			if (!result) throw MokaScrapHistoryError.createFailed()
			await this.cache.deleteMany({ keys: ['list', 'count'] })
			return result
		})
	}

	async updateStatus(
		id: number,
		status: MokaScrapStatus,
		extra?: { rawPath?: string; errorMessage?: string; metadata?: any; recordsCount?: number },
	): Promise<void> {
		return record('MokaScrapHistoryService.updateStatus', async () => {
			await this.repo.updateStatus(id, status, extra)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(configId?: number): Promise<dto.MokaScrapHistoryDto[]> {
		return record('MokaScrapHistoryService.handleList', async () => {
			const key = configId ? `by-config.${configId}` : 'list'
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.listByConfigId(configId),
			})
		})
	}
}

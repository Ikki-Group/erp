import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/lib/cache'

import type {
	MokaProvider,
	MokaScrapStatus,
	MokaScrapType,
	MokaSyncTriggerMode,
} from '../shared.dto'
import * as dto from './scrap-history.dto'
import { MokaScrapHistoryRepo } from './scrap-history.repo'

export class MokaScrapHistoryService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: MokaScrapHistoryRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'moka.scrap-history', client: cacheClient })
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
	): Promise<{ id: number }> {
		return record('MokaScrapHistoryService.create', async () => {
			const result = await this.repo.create(data, actorId)
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

import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/lib/cache'

import type { MokaProvider, MokaScrapType } from '../shared.dto'
import { MokaSyncCursorRepo } from './scrap-sync-cursor.repo'

export class MokaSyncCursorService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: MokaSyncCursorRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'moka.sync-cursor', client: cacheClient })
	}

	async getCursor(mokaConfigurationId: number, type: MokaScrapType) {
		return record('MokaSyncCursorService.getCursor', async () => {
			const key = `cursor.${mokaConfigurationId}.${type}`
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.getCursor(mokaConfigurationId, type),
			})
		})
	}

	async upsertCursor(
		data: {
			mokaConfigurationId: number
			type: MokaScrapType
			provider?: MokaProvider
			cursorDate?: Date | null
			cursorToken?: string | null
			lastHistoryId?: number | null
		},
		actorId: number,
	): Promise<void> {
		return record('MokaSyncCursorService.upsertCursor', async () => {
			await this.repo.upsertCursor(data, actorId)
			await this.cache.deleteMany({ keys: [`cursor.${data.mokaConfigurationId}.${data.type}`] })
		})
	}
}

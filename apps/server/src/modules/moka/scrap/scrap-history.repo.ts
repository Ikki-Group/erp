import { record } from '@elysiajs/opentelemetry'
import { desc, eq } from 'drizzle-orm'

import { CACHE_KEY_DEFAULT, type CacheClient, type CacheProvider } from '@/core/cache'
import { stampCreate, type DbClient } from '@/core/database'
import { logger } from '@/core/logger'

import { mokaScrapHistoriesTable } from '@/db/schema'

import type {
	MokaProvider,
	MokaScrapStatus,
	MokaScrapType,
	MokaSyncTriggerMode,
} from '../shared.dto'
import * as dto from './scrap-history.dto'

const CACHE_NAMESPACE = 'moka.scrap-history'

export class MokaScrapHistoryRepo {
	private readonly db: DbClient
	private readonly cache: CacheProvider

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.db = db
		this.cache = cacheClient.namespace(CACHE_NAMESPACE)
	}

	/* -------------------------------- INTERNAL -------------------------------- */

	#clearCache(id?: number): Promise<void> {
		return record('MokaScrapHistoryRepo.#clearCache', async () => {
			const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
			if (id !== undefined) keys.push(CACHE_KEY_DEFAULT.byId(id))
			await this.cache.deleteMany({ keys })
		})
	}

	#clearCacheAsync(id?: number): void {
		void this.#clearCache(id).catch((error: unknown) => {
			logger.error(error, 'MokaScrapHistoryRepo cache invalidation failed')
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async listByConfigId(configId?: number): Promise<dto.MokaScrapHistoryDto[]> {
		return record('MokaScrapHistoryRepo.listByConfigId', async () => {
			return this.cache.getOrSet({
				key: configId ? `by-config.${configId}` : CACHE_KEY_DEFAULT.list,
				factory: async () => {
					const where = configId
						? eq(mokaScrapHistoriesTable.mokaConfigurationId, configId)
						: undefined

					const rows = await this.db
						.select()
						.from(mokaScrapHistoriesTable)
						.where(where)
						.orderBy(desc(mokaScrapHistoriesTable.createdAt))
						.limit(50)

					return rows.map((r) => dto.MokaScrapHistoryDto.parse(r))
				},
			})
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

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
		return record('MokaScrapHistoryRepo.create', async () => {
			const now = new Date()
			const [result] = await this.db
				.insert(mokaScrapHistoriesTable)
				.values({
					...data,
					provider: data.provider ?? 'moka',
					triggerMode: data.triggerMode ?? 'manual',
					startedAt: data.status === 'processing' ? now : null,
					...stampCreate(actorId),
				})
				.returning({ id: mokaScrapHistoriesTable.id })

			if (!result) throw new Error('Failed to create scrap history')
			this.#clearCacheAsync()
			return result
		})
	}

	async updateStatus(
		id: number,
		status: MokaScrapStatus,
		extra?: { rawPath?: string; errorMessage?: string; metadata?: any; recordsCount?: number },
	) {
		return record('MokaScrapHistoryRepo.updateStatus', async () => {
			const now = new Date()
			const terminal = status === 'completed' || status === 'failed'
			await this.db
				.update(mokaScrapHistoriesTable)
				.set({
					status,
					...extra,
					finishedAt: terminal ? now : undefined,
					updatedAt: now,
				})
				.where(eq(mokaScrapHistoriesTable.id, id))

			this.#clearCacheAsync(id)
		})
	}
}

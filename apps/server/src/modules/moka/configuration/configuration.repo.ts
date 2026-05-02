import { record } from '@elysiajs/opentelemetry'
import { and, eq } from 'drizzle-orm'

import { CACHE_KEY_DEFAULT, type CacheClient, type CacheProvider } from '@/core/cache'
import { stampCreate, stampUpdate, takeFirst, type DbClient } from '@/core/database'
import { logger } from '@/core/logger'

import { mokaConfigurationsTable } from '@/db/schema'

import { type MokaProvider, type MokaScrapType } from '../shared.dto'
import * as dto from './configuration.dto'

const CACHE_NAMESPACE = 'moka.config'

export class MokaConfigurationRepo {
	private readonly db: DbClient
	private readonly cache: CacheProvider

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.db = db
		this.cache = cacheClient.namespace(CACHE_NAMESPACE)
	}

	/* -------------------------------- INTERNAL -------------------------------- */

	#clearCache(id?: number, locationId?: number, provider?: MokaProvider): Promise<void> {
		return record('MokaConfigurationRepo.#clearCache', async () => {
			const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
			if (id !== undefined) keys.push(CACHE_KEY_DEFAULT.byId(id))
			if (locationId !== undefined && provider) keys.push(`by-location.${provider}.${locationId}`)
			await this.cache.deleteMany({ keys })
		})
	}

	#clearCacheAsync(id?: number, locationId?: number, provider?: MokaProvider): void {
		void this.#clearCache(id, locationId, provider).catch((error: unknown) => {
			logger.error(error, 'MokaConfigurationRepo cache invalidation failed')
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async findByLocationId(
		locationId: number,
		provider: MokaProvider = 'moka',
	): Promise<dto.MokaConfigurationDto | null> {
		return record('MokaConfigurationRepo.findByLocationId', async () => {
			return this.cache.getOrSet({
				key: `by-location.${provider}.${locationId}`,
				factory: async () => {
					const result = await this.db
						.select()
						.from(mokaConfigurationsTable)
						.where(
							and(
								eq(mokaConfigurationsTable.locationId, locationId),
								eq(mokaConfigurationsTable.provider, provider),
							),
						)
					const first = takeFirst(result)
					return first ? dto.MokaConfigurationDto.parse(first) : null
				},
			})
		})
	}

	async findById(id: number): Promise<dto.MokaConfigurationOutputDto | undefined> {
		return record('MokaConfigurationRepo.findById', async () => {
			return this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const result = await this.db
						.select()
						.from(mokaConfigurationsTable)
						.where(eq(mokaConfigurationsTable.id, id))
						.then(takeFirst)

					return result ? dto.MokaConfigurationOutputDto.parse(result) : skip()
				},
			})
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: dto.MokaConfigurationCreateDto, actorId: number) {
		return record('MokaConfigurationRepo.create', async () => {
			const [result] = await this.db
				.insert(mokaConfigurationsTable)
				.values({ ...data, ...stampCreate(actorId) })
				.returning({ id: mokaConfigurationsTable.id })

			this.#clearCacheAsync(undefined, data.locationId, 'moka')
			return result
		})
	}

	async update(id: number, data: dto.MokaConfigurationUpdateDto, actorId: number) {
		return record('MokaConfigurationRepo.update', async () => {
			const [result] = await this.db
				.update(mokaConfigurationsTable)
				.set({ ...data, ...stampUpdate(actorId) })
				.where(eq(mokaConfigurationsTable.id, id))
				.returning({ id: mokaConfigurationsTable.id })

			this.#clearCacheAsync(id)
			return result
		})
	}

	async updateAuthData(
		id: number,
		authData: { businessId?: string | null; outletId?: string | null; accessToken?: string | null },
		locationId: number,
		provider: MokaProvider,
	) {
		return record('MokaConfigurationRepo.updateAuthData', async () => {
			await this.db
				.update(mokaConfigurationsTable)
				.set({ ...authData, lastSyncedAt: new Date(), updatedAt: new Date() })
				.where(eq(mokaConfigurationsTable.id, id))

			this.#clearCacheAsync(id, locationId, provider)
		})
	}

	async updateSyncCheckpoint(
		id: number,
		type: MokaScrapType,
		locationId: number,
		provider: MokaProvider,
	) {
		return record('MokaConfigurationRepo.updateSyncCheckpoint', async () => {
			const now = new Date()

			const syncUpdate: {
				lastSyncedAt: Date
				lastSalesSyncedAt?: Date
				lastProductSyncedAt?: Date
				lastCategorySyncedAt?: Date
				updatedAt: Date
			} = {
				lastSyncedAt: now,
				updatedAt: now,
			}

			if (type === 'sales') syncUpdate.lastSalesSyncedAt = now
			if (type === 'product') syncUpdate.lastProductSyncedAt = now
			if (type === 'category') syncUpdate.lastCategorySyncedAt = now

			await this.db
				.update(mokaConfigurationsTable)
				.set(syncUpdate)
				.where(eq(mokaConfigurationsTable.id, id))

			this.#clearCacheAsync(id, locationId, provider)
		})
	}
}

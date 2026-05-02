import { record } from '@elysiajs/opentelemetry'
import { eq } from 'drizzle-orm'

import { CACHE_KEY_DEFAULT, type CacheClient, type CacheProvider } from '@/core/cache'
import { stampCreate, stampUpdate, takeFirst, type DbClient } from '@/core/database'
import { logger } from '@/core/logger'

import { companySettingsTable } from '@/db/schema'

import * as dto from './company-settings.dto'

const COMPANY_SETTINGS_CACHE_NAMESPACE = 'company-settings'

export class CompanySettingsRepo {
	private readonly db: DbClient
	private readonly cache: CacheProvider

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.db = db
		this.cache = cacheClient.namespace(COMPANY_SETTINGS_CACHE_NAMESPACE)
	}

	/* -------------------------------- INTERNAL -------------------------------- */
	#clearCache(): Promise<void> {
		return record('CompanySettingsRepo.#clearCache', async () => {
			const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
			await this.cache.deleteMany({ keys })
		})
	}

	#clearCacheAsync(): void {
		void this.#clearCache().catch((error: unknown) => {
			logger.error(error, 'CompanySettingsRepo cache invalidation failed')
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async get(): Promise<dto.CompanySettingsDto | undefined> {
		return record('CompanySettingsRepo.get', async () => {
			return this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.list,
				factory: async () => {
					const res = await this.db.select().from(companySettingsTable).limit(1).then(takeFirst)

					return res ? dto.CompanySettingsDto.parse(res) : undefined
				},
			})
		})
	}

	async getById(id: number): Promise<dto.CompanySettingsDto | undefined> {
		return record('CompanySettingsRepo.getById', async () => {
			return this.cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const res = await this.db
						.select()
						.from(companySettingsTable)
						.where(eq(companySettingsTable.id, id))
						.limit(1)
						.then(takeFirst)

					return res ? dto.CompanySettingsDto.parse(res) : skip()
				},
			})
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: dto.CompanySettingsCreateDto, actorId: number): Promise<number | undefined> {
		return record('CompanySettingsRepo.create', async () => {
			const metadata = stampCreate(actorId)
			const [res] = await this.db
				.insert(companySettingsTable)
				.values({ ...data, ...metadata })
				.returning({ id: companySettingsTable.id })

			this.#clearCacheAsync()
			return res?.id
		})
	}

	async update(data: dto.CompanySettingsUpdateDto, actorId: number): Promise<number | undefined> {
		return record('CompanySettingsRepo.update', async () => {
			const metadata = stampUpdate(actorId)
			const [res] = await this.db
				.update(companySettingsTable)
				.set({ ...data, ...metadata })
				.where(eq(companySettingsTable.id, data.id))
				.returning({ id: companySettingsTable.id })

			this.#clearCacheAsync()
			return res?.id
		})
	}
}

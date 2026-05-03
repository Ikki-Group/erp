import { record } from '@elysiajs/opentelemetry'
import { and, eq } from 'drizzle-orm'

import { stampCreate, stampUpdate, takeFirst, type DbClient } from '@/core/database'

import { mokaConfigurationsTable } from '@/db/schema'

import { type MokaProvider, type MokaScrapType } from '../shared.dto'
import * as dto from './configuration.dto'

export class MokaConfigurationRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async findByLocationId(
		locationId: number,
		provider: MokaProvider = 'moka',
	): Promise<dto.MokaConfigurationDto | null> {
		return record('MokaConfigurationRepo.findByLocationId', async () => {
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
		})
	}

	async findById(id: number): Promise<dto.MokaConfigurationOutputDto | undefined> {
		return record('MokaConfigurationRepo.findById', async () => {
			const result = await this.db
				.select()
				.from(mokaConfigurationsTable)
				.where(eq(mokaConfigurationsTable.id, id))
				.then(takeFirst)

			return result ? dto.MokaConfigurationOutputDto.parse(result) : undefined
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: dto.MokaConfigurationCreateDto, actorId: number) {
		return record('MokaConfigurationRepo.create', async () => {
			const [result] = await this.db
				.insert(mokaConfigurationsTable)
				.values({ ...data, ...stampCreate(actorId) })
				.returning({ id: mokaConfigurationsTable.id })

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

			return result
		})
	}

	async updateAuthData(
		id: number,
		authData: { businessId?: string | null; outletId?: string | null; accessToken?: string | null },
	) {
		return record('MokaConfigurationRepo.updateAuthData', async () => {
			await this.db
				.update(mokaConfigurationsTable)
				.set({ ...authData, lastSyncedAt: new Date(), updatedAt: new Date() })
				.where(eq(mokaConfigurationsTable.id, id))
		})
	}

	async updateSyncCheckpoint(id: number, type: MokaScrapType) {
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
		})
	}
}

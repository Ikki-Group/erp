import { record } from '@elysiajs/opentelemetry'
import { and, eq } from 'drizzle-orm'

import { mokaConfigurationsTable } from '@/db/schema'

import { takeFirst, type DbContext, type DbClient } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { EntityRef } from '@/shared/types/utils'

import { type MokaProvider, type MokaScrapType } from '../shared.contract'
import * as dto from './configuration.contract'

export interface IMokaConfigurationRepo {
	readonly db: DbContext
	findByLocationId(locationId: number, provider?: MokaProvider, db?: DbContext): Promise<dto.MokaConfigurationDto | undefined>
	findById(id: number, db?: DbContext): Promise<dto.MokaConfigurationOutputDto | undefined>
	create(data: dto.MokaConfigurationCreateDto, actorId: number, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: dto.MokaConfigurationUpdateDto, actorId: number, db?: DbContext): Promise<EntityRef | undefined>
	updateAuthData(id: number, authData: { businessId?: string | null; outletId?: string | null; accessToken?: string | null }, db?: DbContext): Promise<void>
	updateSyncCheckpoint(id: number, type: MokaScrapType, db?: DbContext): Promise<void>
}

export class MokaConfigurationRepo implements IMokaConfigurationRepo {
	constructor(readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async findByLocationId(
		locationId: number,
		provider: MokaProvider = 'moka',
		db: DbContext = this.db,
	): Promise<dto.MokaConfigurationDto | undefined> {
		return record('MokaConfigurationRepo.findByLocationId', async () => {
			const result = await db
				.select()
				.from(mokaConfigurationsTable)
				.where(
					and(
						eq(mokaConfigurationsTable.locationId, locationId),
						eq(mokaConfigurationsTable.provider, provider),
					),
				)
			const first = takeFirst(result)
			return first ? dto.MokaConfigurationDto.parse(first) : undefined
		})
	}

	async findById(id: number, db: DbContext = this.db): Promise<dto.MokaConfigurationOutputDto | undefined> {
		return record('MokaConfigurationRepo.findById', async () => {
			const result = await db
				.select()
				.from(mokaConfigurationsTable)
				.where(eq(mokaConfigurationsTable.id, id))
				.then(takeFirst)

			return result ? dto.MokaConfigurationOutputDto.parse(result) : undefined
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: dto.MokaConfigurationCreateDto, actorId: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		return record('MokaConfigurationRepo.create', async () => {
			const [result] = await db
				.insert(mokaConfigurationsTable)
				.values({ ...data, ...stampCreate(actorId) })
				.returning({ id: mokaConfigurationsTable.id })

			return result
		})
	}

	async update(id: number, data: dto.MokaConfigurationUpdateDto, actorId: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		return record('MokaConfigurationRepo.update', async () => {
			const [result] = await db
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
		db: DbContext = this.db,
	): Promise<void> {
		return record('MokaConfigurationRepo.updateAuthData', async () => {
			await db
				.update(mokaConfigurationsTable)
				.set({ ...authData, lastSyncedAt: new Date(), updatedAt: new Date() })
				.where(eq(mokaConfigurationsTable.id, id))
		})
	}

	async updateSyncCheckpoint(id: number, type: MokaScrapType, db: DbContext = this.db): Promise<void> {
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

			await db
				.update(mokaConfigurationsTable)
				.set(syncUpdate)
				.where(eq(mokaConfigurationsTable.id, id))
		})
	}
}

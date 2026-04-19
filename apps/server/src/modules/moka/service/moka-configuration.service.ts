import { eq } from 'drizzle-orm'
import { bento } from '@/core/cache'
import { stampCreate, stampUpdate, takeFirst } from '@/core/database'
import { ConflictError, NotFoundError } from '@/core/http/errors'

import { db } from '@/db'
import { mokaConfigurationsTable } from '@/db/schema'

import {
	MokaConfigurationDto,
	MokaConfigurationOutputDto,
	type MokaConfigurationCreateDto,
	type MokaConfigurationUpdateDto,
} from '../dto/moka-configuration.dto'

const err = {
	notFound: (id: number) => new NotFoundError(`Moka configuration ${id} not found`),
	locationAlreadyHasConfig: (locationId: number) =>
		new ConflictError(`Location ${locationId} already has a Moka configuration`),
}

const cache = bento.namespace('moka.config')

export class MokaConfigurationService {
	async findByLocationId(locationId: number): Promise<MokaConfigurationDto | null> {
		return cache.getOrSet({
			key: `by-location.${locationId}`,
			factory: async () => {
				const result = await db
					.select()
					.from(mokaConfigurationsTable)
					.where(eq(mokaConfigurationsTable.locationId, locationId))
				const first = takeFirst(result)
				return first ? MokaConfigurationDto.parse(first) : null
			},
		})
	}

	async handleDetail(id: number): Promise<MokaConfigurationOutputDto> {
		return cache.getOrSet({
			key: `detail.${id}`,
			factory: async () => {
				const result = await db
					.select()
					.from(mokaConfigurationsTable)
					.where(eq(mokaConfigurationsTable.id, id))
				const first = takeFirst(result)
				if (!first) throw err.notFound(id)
				return MokaConfigurationOutputDto.parse(first)
			},
		})
	}

	async handleCreate(data: MokaConfigurationCreateDto, actorId: number): Promise<{ id: number }> {
		const existing = await this.findByLocationId(data.locationId)
		if (existing) throw err.locationAlreadyHasConfig(data.locationId)

		const [result] = await db
			.insert(mokaConfigurationsTable)
			.values({ ...data, ...stampCreate(actorId) })
			.returning({ id: mokaConfigurationsTable.id })

		if (!result) throw new Error('Failed to create Moka configuration')
		await this.clearCache(result.id, data.locationId)
		return result
	}

	async handleUpdate(
		id: number,
		data: MokaConfigurationUpdateDto,
		actorId: number,
	): Promise<{ id: number }> {
		const existing = await this.handleDetail(id)

		if (data.locationId && data.locationId !== existing.locationId) {
			const other = await this.findByLocationId(data.locationId)
			if (other) throw err.locationAlreadyHasConfig(data.locationId)
		}

		const [result] = await db
			.update(mokaConfigurationsTable)
			.set({ ...data, ...stampUpdate(actorId) })
			.where(eq(mokaConfigurationsTable.id, id))
			.returning({ id: mokaConfigurationsTable.id })

		if (!result) throw err.notFound(id)
		await this.clearCache(id, data.locationId)
		return result
	}

	async updateAuthData(
		id: number,
		authData: { businessId?: string | null; outletId?: string | null; accessToken?: string | null },
	) {
		await db
			.update(mokaConfigurationsTable)
			.set({ ...authData, lastSyncedAt: new Date(), updatedAt: new Date() })
			.where(eq(mokaConfigurationsTable.id, id))
		await this.clearCache(id)
	}

	private async clearCache(id?: number, locationId?: number) {
		const keys = []
		if (id) keys.push(`detail.${id}`)
		if (locationId) keys.push(`by-location.${locationId}`)
		await cache.deleteMany({ keys })
	}
}

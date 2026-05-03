import { record } from '@elysiajs/opentelemetry'

import { ConflictError, NotFoundError } from '@/core/http/errors'

import { CacheService, type CacheClient } from '@/lib/cache'

import type { MokaProvider, MokaScrapType } from '../shared.dto'
import * as dto from './configuration.dto'
import { MokaConfigurationRepo } from './configuration.repo'

const err = {
	notFound: (id: number) => new NotFoundError(`Moka configuration ${id} not found`),
	locationAlreadyHasConfig: (locationId: number) =>
		new ConflictError(`Location ${locationId} already has a Moka configuration`),
}

export class MokaConfigurationService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: MokaConfigurationRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'moka.config', client: cacheClient })
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async findByLocationId(
		locationId: number,
		provider: MokaProvider = 'moka',
	): Promise<dto.MokaConfigurationDto | null> {
		return record('MokaConfigurationService.findByLocationId', async () => {
			const key = `by-location.${provider}.${locationId}`
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.findByLocationId(locationId, provider),
			})
		})
	}

	async updateAuthData(
		id: number,
		authData: { businessId?: string | null; outletId?: string | null; accessToken?: string | null },
	): Promise<void> {
		return record('MokaConfigurationService.updateAuthData', async () => {
			const existing = await this.handleDetail(id)
			await this.repo.updateAuthData(id, authData)
			await this.cache.deleteMany({
				keys: [`by-location.${existing.provider}.${existing.locationId}`, `byId:${id}`],
			})
		})
	}

	async updateSyncCheckpoint(id: number, type: MokaScrapType): Promise<void> {
		return record('MokaConfigurationService.updateSyncCheckpoint', async () => {
			const existing = await this.handleDetail(id)
			await this.repo.updateSyncCheckpoint(id, type)
			await this.cache.deleteMany({
				keys: [`by-location.${existing.provider}.${existing.locationId}`, `byId:${id}`],
			})
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleDetail(id: number): Promise<dto.MokaConfigurationOutputDto> {
		return record('MokaConfigurationService.handleDetail', async () => {
			const key = `byId:${id}`
			const result = await this.cache.getOrSetSkipUndefined({
				key,
				factory: () => this.repo.findById(id),
			})
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleCreate(
		data: dto.MokaConfigurationCreateDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('MokaConfigurationService.handleCreate', async () => {
			const existing = await this.findByLocationId(data.locationId, 'moka')
			if (existing) throw err.locationAlreadyHasConfig(data.locationId)

			const result = await this.repo.create(data, actorId)
			if (!result) throw new Error('Failed to create Moka configuration')
			await this.cache.deleteMany({
				keys: ['list', 'count', `by-location.moka.${data.locationId}`],
			})
			return result
		})
	}

	async handleUpdate(
		id: number,
		data: dto.MokaConfigurationUpdateDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('MokaConfigurationService.handleUpdate', async () => {
			const existing = await this.handleDetail(id)

			if (data.locationId && data.locationId !== existing.locationId) {
				const other = await this.findByLocationId(data.locationId, existing.provider)
				if (other) throw err.locationAlreadyHasConfig(data.locationId)
			}

			const result = await this.repo.update(id, data, actorId)
			if (!result) throw err.notFound(id)
			await this.cache.deleteMany({
				keys: [
					'list',
					'count',
					`byId:${id}`,
					`by-location.${existing.provider}.${existing.locationId}`,
				],
			})
			return result
		})
	}
}

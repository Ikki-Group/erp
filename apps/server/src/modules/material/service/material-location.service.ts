import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'

import type { DbTx } from '@/infra/database'

import type { WithPaginationResult } from '@/shared/types/pagination'

import type { LocationModule } from '@/modules/location'

import type { MaterialLocation } from '../domain/material-location.entity'
import type {
	IMaterialLocationRepo,
	LocationStockFilter,
	MaterialLocationStock,
	MaterialLocationWithLocation,
} from '../domain/ports'
import { MATERIAL_CACHE_NS } from '../material.constants'
import { LocationErrors } from '../material.errors'
import type { MaterialService } from './material.service'

export class MaterialLocationService {
	private readonly cache: CacheService

	constructor(
		private readonly deps: {
			master: MaterialService
			location: LocationModule
			repo: IMaterialLocationRepo
		},
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, MATERIAL_CACHE_NS.LOCATION)
	}

	/* ======================== PUBLIC API ======================== */

	async findOne(materialId: number, locationId: number): Promise<MaterialLocation> {
		return record('MaterialLocationService.findOne', async () => {
			const result = await this.deps.repo.getOne(materialId, locationId)
			if (!result) throw LocationErrors.notAssigned(materialId, locationId)
			return result
		})
	}

	async findByMaterialId(materialId: number): Promise<MaterialLocation[]> {
		return record('MaterialLocationService.findByMaterialId', () =>
			this.deps.repo.getByMaterialId(materialId),
		)
	}

	async findByLocationId(locationId: number): Promise<MaterialLocation[]> {
		return record('MaterialLocationService.findByLocationId', () =>
			this.deps.repo.getByLocationId(locationId),
		)
	}

	/* ======================== USE CASES ======================== */

	async assign(
		data: { locationIds: number[]; materialIds: number[] },
		actorId: number,
	): Promise<{ assignedCount: number }> {
		return record('MaterialLocationService.assign', async () => {
			for (const locId of data.locationIds) await this.deps.location.getById(locId)
			for (const mId of data.materialIds) await this.deps.master.findById(mId)

			const assignedCount = await this.deps.repo.batchAssign(
				data.materialIds,
				data.locationIds,
				actorId,
			)
			await this.invalidateKeys(data.materialIds, data.locationIds)
			return { assignedCount }
		})
	}

	async unassign(data: { materialId: number; locationId: number }): Promise<{ id: number }> {
		return record('MaterialLocationService.unassign', async () => {
			const resultId = await this.deps.repo.unassign(data.materialId, data.locationId)
			if (!resultId) throw LocationErrors.notAssigned(data.materialId, data.locationId)

			await this.invalidateKeys([data.materialId], [data.locationId])
			return { id: resultId }
		})
	}

	async locationsByMaterial(materialId: number): Promise<MaterialLocationWithLocation[]> {
		return record('MaterialLocationService.locationsByMaterial', async () => {
			await this.deps.master.findById(materialId)
			return this.deps.repo.getLocationsByMaterial(materialId)
		})
	}

	async stockByLocation(
		filter: LocationStockFilter,
	): Promise<WithPaginationResult<MaterialLocationStock>> {
		return record('MaterialLocationService.stockByLocation', async () => {
			await this.deps.location.getById(filter.locationId)
			return this.deps.repo.getStockByLocationPaginated(filter)
		})
	}

	async updateConfig(
		data: {
			id: number
			minStock?: number | undefined
			maxStock?: number | null | undefined
			reorderPoint?: number | undefined
		},
		actorId: number,
	): Promise<{ id: number }> {
		return record('MaterialLocationService.updateConfig', async () => {
			const { id, ...update } = data
			const resultId = await this.deps.repo.updateConfig(id, update, actorId)
			if (!resultId) throw LocationErrors.notFound(id)

			await this.cache.deleteFromKeys(['by-material:*', 'by-location:*', 'one:*:*'])
			return { id: resultId }
		})
	}

	/** Called by inventory module after recording a transaction */
	async updateCurrentStock(
		materialId: number,
		locationId: number,
		stock: { currentQty: number; currentAvgCost: number; currentValue: number },
		actorId: number,
		tx?: DbTx,
	): Promise<void> {
		return record('MaterialLocationService.updateCurrentStock', async () => {
			await this.deps.repo.updateCurrentStock(materialId, locationId, stock, actorId, tx)
			await this.invalidateKeys([materialId], [locationId])
		})
	}

	/* ======================== PRIVATE ======================== */

	private async invalidateKeys(materialIds: number[], locationIds: number[]): Promise<void> {
		const keys: string[] = []
		for (const mid of materialIds) keys.push(`by-material:${mid}`, `locations-by-material:${mid}`)
		for (const lid of locationIds) keys.push(`by-location:${lid}`)
		await this.cache.deleteFromKeys(keys)
	}
}

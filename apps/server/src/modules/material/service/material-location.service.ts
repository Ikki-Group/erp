import { record } from '@elysiajs/opentelemetry'

import type { DbTx } from '@/core/database'
import { ConflictError, NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import type { LocationServiceModule } from '@/modules/location'

import type {
	MaterialLocationAssignDto,
	MaterialLocationConfigDto,
	MaterialLocationDto,
	MaterialLocationFilterDto,
	MaterialLocationStockDto,
	MaterialLocationUnassignDto,
	MaterialLocationWithLocationDto,
} from '../dto'
import { MaterialLocationRepo } from '../repo'
import type { MaterialService } from './material.service'

const err = {
	notFound: (id: number) =>
		new NotFoundError(
			`Material-Location assignment with ID ${id} not found`,
			'MATERIAL_LOCATION_NOT_FOUND',
		),
	notAssigned: (materialId: number, locationId: number) =>
		new NotFoundError(
			`Material ${materialId} is not assigned to location ${locationId}`,
			'MATERIAL_NOT_ASSIGNED_TO_LOCATION',
		),
	alreadyAssigned: (materialId: number, locationId: number) =>
		new ConflictError(
			`Material ${materialId} is already assigned to location ${locationId}`,
			'MATERIAL_LOCATION_ALREADY_ASSIGNED',
		),
}

export class MaterialLocationService {
	constructor(
		private readonly materialSvc: MaterialService,
		private readonly locationSvc: LocationServiceModule,
		private readonly repo: MaterialLocationRepo = new MaterialLocationRepo(),
	) {}

	/* --------------------------------- PUBLIC --------------------------------- */

	/** Get a specific material-location assignment */
	async findOne(materialId: number, locationId: number): Promise<MaterialLocationDto> {
		return record('MaterialLocationService.findOne', async () => {
			const result = await this.repo.getOne(materialId, locationId)
			if (!result) throw err.notAssigned(materialId, locationId)
			return result
		})
	}

	/** Get all assignments for a specific material */
	async findByMaterialId(materialId: number): Promise<MaterialLocationDto[]> {
		return record('MaterialLocationService.findByMaterialId', async () => {
			return this.repo.getByMaterialId(materialId)
		})
	}

	/** Get all assignments for a specific location */
	async findByLocationId(locationId: number): Promise<MaterialLocationDto[]> {
		return record('MaterialLocationService.findByLocationId', async () => {
			return this.repo.getByLocationId(locationId)
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	/**
	 * Assign multiple materials to multiple locations (batch).
	 * Skips any that are already assigned (upsert-like).
	 */
	async handleAssign(
		data: MaterialLocationAssignDto,
		actorId: number,
	): Promise<{ assignedCount: number }> {
		return record('MaterialLocationService.handleAssign', async () => {
			const { locationIds, materialIds } = data

			// 1. Validate all locations exist
			for (const locId of locationIds) {
				await this.locationSvc.master.getById(locId)
			}

			// 2. Validate all materials exist
			for (const mId of materialIds) {
				await this.materialSvc.getById(mId)
			}

			// 3. Batch assign via repo
			const assignedCount = await this.repo.batchAssign(materialIds, locationIds, actorId)
			return { assignedCount }
		})
	}

	/**
	 * Unassign a material from a location.
	 */
	async handleUnassign(data: MaterialLocationUnassignDto): Promise<{ id: number }> {
		return record('MaterialLocationService.handleUnassign', async () => {
			const { materialId, locationId } = data
			const resultId = await this.repo.unassign(materialId, locationId)

			if (!resultId) throw err.notAssigned(materialId, locationId)
			return { id: resultId }
		})
	}

	/**
	 * List all locations assigned to a material, enriched with location details.
	 */
	async handleLocationsByMaterial(materialId: number): Promise<MaterialLocationWithLocationDto[]> {
		return record('MaterialLocationService.handleLocationsByMaterial', async () => {
			await this.materialSvc.getById(materialId)
			return this.repo.getLocationsByMaterial(materialId)
		})
	}

	/**
	 * List materials at a specific location with stock data (paginated).
	 * Joining with material data.
	 */
	async handleStockByLocation(
		filter: MaterialLocationFilterDto,
	): Promise<WithPaginationResult<MaterialLocationStockDto>> {
		return record('MaterialLocationService.handleStockByLocation', async () => {
			const { locationId } = filter
			await this.locationSvc.master.getById(locationId)
			return this.repo.getStockByLocationPaginated(filter)
		})
	}

	/**
	 * Update per-location config (minStock, maxStock, reorderPoint).
	 */
	async handleUpdateConfig(
		data: MaterialLocationConfigDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('MaterialLocationService.handleUpdateConfig', async () => {
			const { id, ...update } = data
			const resultId = await this.repo.updateConfig(id, update, actorId)

			if (!resultId) throw err.notFound(id)
			return { id: resultId }
		})
	}

	/* ---------------- INVENTORY STOCK SYNC (called by inventory module) ---------------- */

	/**
	 * Update current stock snapshot. Called by the inventory module after recording a transaction.
	 */
	async updateCurrentStock(
		materialId: number,
		locationId: number,
		stock: { currentQty: number; currentAvgCost: number; currentValue: number },
		actorId: number,
		tx?: DbTx,
	): Promise<void> {
		return record('MaterialLocationService.updateCurrentStock', async () => {
			await this.repo.updateCurrentStock(materialId, locationId, stock, actorId, tx)
		})
	}
}

import { auditLog } from '@/infra/audit/index.ts'
import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { stampCreate } from '@/shared/audit/stamp.ts'
import { ConflictError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'
import type { ActorId, EntityRef } from '@/shared/types/utils.ts'

import type { LocationService } from '@/modules/location/location.service.ts'

import type { MaterialService } from '../material.service.ts'
import type { MaterialAssignDto, MaterialLocationDto } from './assignment.contract.ts'
import type { IAssignmentRepo } from './assignment.repo.ts'

// ─── Error Factories ───

const AssignmentError = {
	alreadyAssigned: (materialId: number, locationId: number) =>
		new ConflictError('Material is already assigned to this location', {
			code: 'MATERIAL_ALREADY_ASSIGNED',
			context: { materialId, locationId },
		}),
	notAssigned: (materialId: number, locationId: number) =>
		new NotFoundError('Material is not assigned to this location', {
			code: 'MATERIAL_NOT_ASSIGNED',
			context: { materialId, locationId },
		}),
	assignFailed: () =>
		new InternalServerError('Material assignment failed', { code: 'MATERIAL_ASSIGN_FAILED' }),
}

// ─── Service ───

export class AssignmentService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IAssignmentRepo,
		cacheClient: CacheClient,
		private readonly materialService: MaterialService,
		private readonly locationService: LocationService,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'material-assignment')
	}

	// ─── Reads ───

	/** Check if a material is assigned to a location. Used by inventory/stock. */
	async isAssigned(materialId: number, locationId: number): Promise<boolean> {
		const row = await this.repo.findOne(materialId, locationId)
		return row !== undefined
	}

	async handleByLocation(locationId: number): Promise<MaterialLocationDto[]> {
		return this.repo.findByLocationId(locationId)
	}

	async handleByMaterial(materialId: number): Promise<MaterialLocationDto[]> {
		return this.repo.findByMaterialId(materialId)
	}

	// ─── Handlers ───

	async handleAssign(data: MaterialAssignDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Validate material exists
		await this.materialService.handleGetById(data.materialId)

		// 2. Validate location exists
		await this.locationService.handleGetById(data.locationId)

		// 3. Check not already assigned
		const existing = await this.repo.findOne(data.materialId, data.locationId)
		if (existing) {
			throw AssignmentError.alreadyAssigned(data.materialId, data.locationId)
		}

		// 4. Insert
		const result = await this.repo.insert({
			materialId: data.materialId,
			locationId: data.locationId,
			...stampCreate(actorId),
		})
		if (!result) throw AssignmentError.assignFailed()

		// 5. Invalidate cache
		await this.cache.invalidateStandard()

		// 6. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'material',
			entity: 'material_location',
			entityId: result.id,
			action: 'create',
			summary: `Assigned material #${data.materialId} to location #${data.locationId}`,
			newValues: { materialId: data.materialId, locationId: data.locationId },
		})

		return result
	}

	async handleUnassign(data: MaterialAssignDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Validate assignment exists
		const existing = await this.repo.findOne(data.materialId, data.locationId)
		if (!existing) {
			throw AssignmentError.notAssigned(data.materialId, data.locationId)
		}

		// 2. Remove
		const result = await this.repo.remove(data.materialId, data.locationId)
		if (!result) throw AssignmentError.notAssigned(data.materialId, data.locationId)

		// 3. Invalidate cache
		await this.cache.invalidateStandard()

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'material',
			entity: 'material_location',
			entityId: existing.id,
			action: 'delete',
			summary: `Unassigned material #${data.materialId} from location #${data.locationId}`,
		})

		return result
	}
}

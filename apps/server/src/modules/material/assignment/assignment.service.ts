import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { stampCreate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { mutate } from '@/shared/service/mutate.ts'
import type { MutationScope } from '@/shared/service/mutate.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

import type { LocationService } from '@/modules/location/location.service.ts'

import type { MaterialService } from '../material.service.ts'
import type { MaterialAssignDto, MaterialLocationDto } from './assignment.contract.ts'
import { AssignmentError } from './assignment.internal.ts'
import type { IAssignmentRepo } from './assignment.repo.ts'

// ─── Service ───

export interface AssignmentServiceDeps {
	uow: UnitOfWork
	audit: AuditPort
}

export class AssignmentService {
	private readonly cache: CacheService
	private readonly mutation: MutationScope

	constructor(
		private readonly repo: IAssignmentRepo,
		cacheClient: CacheClient,
		private readonly materialService: MaterialService,
		private readonly locationService: LocationService,
		deps: AssignmentServiceDeps,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'material-assignment')
		this.mutation = {
			uow: deps.uow,
			audit: deps.audit,
			module: 'material',
			entity: 'material_location',
			invalidate: this.cache,
		}
	}

	// ─── Reads ───

	/** Check if a material is assigned to a location. Used by inventory/stock. */
	async isAssigned(materialId: number, locationId: number, db?: DbContext): Promise<boolean> {
		const row = await this.repo.findOne(materialId, locationId, db)
		return row !== undefined
	}

	async handleByLocation(locationId: number): Promise<MaterialLocationDto[]> {
		return this.repo.findByLocationId(locationId)
	}

	async handleByMaterial(materialId: number): Promise<MaterialLocationDto[]> {
		return this.repo.findByMaterialId(materialId)
	}

	// ─── Handlers ───

	async handleAssign(data: MaterialAssignDto, actor: Actor): Promise<EntityRef> {
		// 1. Validate material exists
		await this.materialService.handleGetById(data.materialId)

		// 2. Validate location exists
		await this.locationService.handleGetById(data.locationId)

		return mutate(this.mutation, actor, async (tx) => {
			// 3. Check not already assigned
			const existing = await this.repo.findOne(data.materialId, data.locationId, tx)
			if (existing) {
				throw AssignmentError.alreadyAssigned(data.materialId, data.locationId)
			}

			// 4. Insert
			const written = await this.repo.insert(
				{
					materialId: data.materialId,
					locationId: data.locationId,
					...stampCreate(actor.id),
				},
				tx,
			)
			if (!written) throw AssignmentError.assignFailed()

			return {
				result: written,
				audit: {
					action: 'create',
					summary: `Assigned material #${data.materialId} to location #${data.locationId}`,
					newValues: { materialId: data.materialId, locationId: data.locationId },
				},
			}
		})
	}

	async handleUnassign(data: MaterialAssignDto, actor: Actor): Promise<EntityRef> {
		return mutate(this.mutation, actor, async (tx) => {
			// 1. Validate assignment exists
			const existing = await this.repo.findOne(data.materialId, data.locationId, tx)
			if (!existing) {
				throw AssignmentError.notAssigned(data.materialId, data.locationId)
			}

			// 2. Remove
			const written = await this.repo.remove(data.materialId, data.locationId, tx)
			if (!written) throw AssignmentError.notAssigned(data.materialId, data.locationId)

			return {
				result: written,
				audit: {
					entityId: existing.id,
					action: 'delete',
					summary: `Unassigned material #${data.materialId} from location #${data.locationId}`,
				},
			}
		})
	}
}

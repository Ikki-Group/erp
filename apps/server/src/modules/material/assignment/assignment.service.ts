import type { Db } from '@/infra/database/index.ts'
import { stampCreate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { ConflictError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'
import type { Infra } from '@/shared/module.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { LocationService } from '@/modules/location/index.ts'

import type { MaterialService } from '../material.service.ts'
import type { MaterialAssignDto, MaterialLocationDto } from './assignment.contract.ts'
import type { AssignmentRepo } from './assignment.repo.ts'

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

interface Deps extends Infra {
	repo: AssignmentRepo
	material: Pick<MaterialService, 'handleGetById'>
	location: Pick<LocationService, 'handleGetById'>
}

const AUDIT = { module: 'material', entity: 'material_location' } as const

export class AssignmentService {
	constructor(private readonly deps: Deps) {}

	async isAssigned(materialId: number, locationId: number, db?: Db): Promise<boolean> {
		return (await this.deps.repo.findOne(materialId, locationId, db)) !== undefined
	}

	handleByLocation(locationId: number): Promise<MaterialLocationDto[]> {
		return this.deps.repo.findByLocationId(locationId)
	}

	handleByMaterial(materialId: number): Promise<MaterialLocationDto[]> {
		return this.deps.repo.findByMaterialId(materialId)
	}

	async handleAssign(data: MaterialAssignDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit, material, location } = this.deps
		await material.handleGetById(data.materialId)
		await location.handleGetById(data.locationId)
		return uow.run(async (tx) => {
			if (await repo.findOne(data.materialId, data.locationId, tx)) {
				throw AssignmentError.alreadyAssigned(data.materialId, data.locationId)
			}
			const written = await repo.insert(
				{ materialId: data.materialId, locationId: data.locationId, ...stampCreate(actor.id) },
				tx,
			)
			if (!written) throw AssignmentError.assignFailed()
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: written.id,
				action: 'create',
				summary: `Assigned material #${data.materialId} to location #${data.locationId}`,
				newValues: { materialId: data.materialId, locationId: data.locationId },
				locationId: data.locationId,
			})
			return written
		})
	}

	handleUnassign(data: MaterialAssignDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await repo.findOne(data.materialId, data.locationId, tx)
			if (!existing) throw AssignmentError.notAssigned(data.materialId, data.locationId)
			const written = await repo.remove(data.materialId, data.locationId, tx)
			if (!written) throw AssignmentError.notAssigned(data.materialId, data.locationId)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: existing.id,
				action: 'delete',
				summary: `Unassigned material #${data.materialId} from location #${data.locationId}`,
				locationId: data.locationId,
			})
			return written
		})
	}
}

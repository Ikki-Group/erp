import { paymentMethods } from '@/db/schema/pos.ts'

import { checkConflict } from '@/infra/database/conflict.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import type { Infra } from '@/shared/module.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { LocationService } from '@/modules/location/index.ts'

import {
	LocationAssignmentError,
	PaymentMethodError,
	uniqueFields,
} from './payment-method.internal.ts'
import type { PaymentMethodRepo } from './payment-method.repo.ts'
import type {
	PaymentMethodCreateDto,
	PaymentMethodDto,
	PaymentMethodFilterDto,
	PaymentMethodLocationAssignDto,
	PaymentMethodUpdateDto,
} from '@ikki/contract/payment-method'

interface Deps extends Infra {
	repo: PaymentMethodRepo
	location: Pick<LocationService, 'handleGetById'>
}

const AUDIT = { module: 'payment-method', entity: 'payment_method' } as const
const AUDIT_LOCATION = { module: 'payment-method', entity: 'payment_method_location' } as const

export class PaymentMethodService {
	constructor(private readonly deps: Deps) {}

	async handleGetById(id: number): Promise<PaymentMethodDto> {
		const method = await this.deps.repo.findById(id)
		if (!method) throw PaymentMethodError.notFound(id)
		return method
	}

	handleList(filter: PaymentMethodFilterDto): Promise<WithPaginationResult<PaymentMethodDto>> {
		return this.deps.repo.findPage(filter)
	}

	/** Active methods enabled at the location. */
	handleByLocation(locationId: number): Promise<PaymentMethodDto[]> {
		return this.deps.repo.findByLocation(locationId)
	}

	handleCreate(data: PaymentMethodCreateDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			await checkConflict({
				db: tx,
				table: paymentMethods,
				pkColumn: paymentMethods.id,
				fields: uniqueFields,
				input: data,
			})
			const written = await repo.insert({ ...data, ...stampCreate(actor.id) }, tx)
			if (!written) throw PaymentMethodError.createFailed()
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: written.id,
				action: 'create',
				summary: `Created payment method "${data.name}" (${data.code})`,
				newValues: { code: data.code, name: data.name, type: data.type },
			})
			return written
		})
	}

	handleUpdate(data: PaymentMethodUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...changes } = data
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await repo.findById(id, tx)
			if (!existing) throw PaymentMethodError.notFound(id)
			await checkConflict({
				db: tx,
				table: paymentMethods,
				pkColumn: paymentMethods.id,
				fields: uniqueFields,
				input: changes,
				excludeId: id,
			})
			const written = await repo.update(id, { ...changes, ...stampUpdate(actor.id) }, tx)
			if (!written) throw PaymentMethodError.updateFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'update',
				summary: `Updated payment method "${data.name}" (${data.code})`,
				oldValues: { code: existing.code, name: existing.name, type: existing.type },
				newValues: { code: data.code, name: data.name, type: data.type },
			})
			return written
		})
	}

	handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await repo.findById(id, tx)
			if (!existing) throw PaymentMethodError.notFound(id)
			const written = await repo.remove(id, stampUpdate(actor.id), tx)
			if (!written) throw PaymentMethodError.deleteFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'delete',
				summary: `Deleted payment method "${existing.name}" (${existing.code})`,
			})
			return written
		})
	}

	// ─── Location Assignment ───

	async handleAssign(data: PaymentMethodLocationAssignDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit, location } = this.deps
		await location.handleGetById(data.locationId)
		return uow.run(async (tx) => {
			if (!(await repo.findById(data.paymentMethodId, tx))) {
				throw PaymentMethodError.notFound(data.paymentMethodId)
			}
			const written = await repo.upsertLocationAssignment(
				{
					paymentMethodId: data.paymentMethodId,
					locationId: data.locationId,
					isEnabled: data.isEnabled,
				},
				tx,
			)
			if (!written) throw LocationAssignmentError.assignFailed()
			await audit.record(tx, actor, {
				...AUDIT_LOCATION,
				entityId: written.id,
				action: 'create',
				summary: `Assigned payment method #${data.paymentMethodId} to location #${data.locationId} (enabled: ${data.isEnabled})`,
				newValues: {
					paymentMethodId: data.paymentMethodId,
					locationId: data.locationId,
					isEnabled: data.isEnabled,
				},
				locationId: data.locationId,
			})
			return written
		})
	}

	handleUnassign(data: PaymentMethodLocationAssignDto, actor: Actor): Promise<EntityRef> {
		const { paymentMethodId, locationId } = data
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const written = await repo.removeLocationAssignment(paymentMethodId, locationId, tx)
			if (!written) throw LocationAssignmentError.notAssigned(paymentMethodId, locationId)
			await audit.record(tx, actor, {
				...AUDIT_LOCATION,
				entityId: written.id,
				action: 'delete',
				summary: `Unassigned payment method #${paymentMethodId} from location #${locationId}`,
				locationId,
			})
			return written
		})
	}
}

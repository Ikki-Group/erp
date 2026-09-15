import { paymentMethods } from '@/db/schema/pos.ts'

import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { LocationService } from '@/modules/location/location.service.ts'

import type {
	PaymentMethodCreateDto,
	PaymentMethodDto,
	PaymentMethodFilterDto,
	PaymentMethodLocationAssignDto,
	PaymentMethodUpdateDto,
} from './payment-method.contract.ts'
import {
	LocationAssignmentError,
	PaymentMethodError,
	uniqueFields,
} from './payment-method.internal.ts'
import type { IPaymentMethodRepo } from './payment-method.repo.ts'

// ─── Cache Keys ───

function locationCacheKey(locationId: number): string {
	return `payment-method:location:${locationId}`
}

// ─── Service ───

export interface PaymentMethodServiceDeps {
	uow: UnitOfWork
	audit: AuditPort
}

export class PaymentMethodService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IPaymentMethodRepo,
		cacheClient: CacheClient,
		private readonly locationService: LocationService,
		private readonly deps: PaymentMethodServiceDeps,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'payment-method')
	}

	// ─── Cached Reads ───

	async getById(id: number): Promise<PaymentMethodDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	async getAll(): Promise<PaymentMethodDto[]> {
		return this.cache.getOrSet({
			key: this.cache.keys.list,
			factory: () => this.repo.findMany(),
		})
	}

	async getByLocation(locationId: number): Promise<PaymentMethodDto[]> {
		return this.cache.getOrSet({
			key: locationCacheKey(locationId),
			factory: () => this.repo.findByLocation(locationId),
		})
	}

	// ─── Handlers ───

	async handleGetById(id: number): Promise<PaymentMethodDto> {
		return assertFound(await this.getById(id), () => PaymentMethodError.notFound(id))
	}

	async handleList(
		filter: PaymentMethodFilterDto,
	): Promise<WithPaginationResult<PaymentMethodDto>> {
		return this.repo.findPage(filter)
	}

	async handleByLocation(locationId: number): Promise<PaymentMethodDto[]> {
		return this.getByLocation(locationId)
	}

	async handleCreate(data: PaymentMethodCreateDto, actor: Actor): Promise<EntityRef> {
		const result = await this.deps.uow.run(async (tx) => {
			// 1. Check conflicts
			await checkConflict({
				db: tx,
				table: paymentMethods,
				pkColumn: paymentMethods.id,
				fields: uniqueFields,
				input: data,
			})

			// 2. Insert
			const written = await this.repo.insert(
				{
					...data,
					isActive: data.isActive,
					...stampCreate(actor.id),
				},
				tx,
			)
			if (!written) throw PaymentMethodError.createFailed()

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'payment-method',
					entity: 'payment_method',
					entityId: written.id,
					action: 'create',
					summary: `Created payment method "${data.name}" (${data.code})`,
					newValues: { code: data.code, name: data.name, type: data.type },
				}),
				tx,
			)
			return written
		})

		// 3. Invalidate cache after commit
		await this.cache.invalidateStandard()
		return result
	}

	async handleUpdate(data: PaymentMethodUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data

		const result = await this.deps.uow.run(async (tx) => {
			// 1. Verify exists
			const existing = await this.repo.findById(id, tx)
			if (!existing) throw PaymentMethodError.notFound(id)

			// 2. Check conflicts (exclude self)
			await checkConflict({
				db: tx,
				table: paymentMethods,
				pkColumn: paymentMethods.id,
				fields: uniqueFields,
				input: updateData,
				excludeId: id,
			})

			// 3. Update
			const written = await this.repo.update(
				id,
				{
					...updateData,
					isActive: updateData.isActive,
					...stampUpdate(actor.id),
				},
				tx,
			)
			if (!written) throw PaymentMethodError.updateFailed(id)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'payment-method',
					entity: 'payment_method',
					entityId: id,
					action: 'update',
					summary: `Updated payment method "${data.name}" (${data.code})`,
					newValues: { code: data.code, name: data.name, type: data.type },
				}),
				tx,
			)
			return written
		})

		// 4. Invalidate cache after commit
		await this.cache.invalidateStandard(id)
		return result
	}

	async handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		const result = await this.deps.uow.run(async (tx) => {
			// 1. Verify exists
			const existing = await this.repo.findById(id, tx)
			if (!existing) throw PaymentMethodError.notFound(id)

			// 2. Soft-delete
			const written = await this.repo.remove(id, stampUpdate(actor.id), tx)
			if (!written) throw PaymentMethodError.deleteFailed(id)

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'payment-method',
					entity: 'payment_method',
					entityId: id,
					action: 'delete',
					summary: `Deleted payment method "${existing.name}" (${existing.code})`,
				}),
				tx,
			)
			return written
		})

		// 3. Invalidate cache after commit
		await this.cache.invalidateStandard(id)
		return result
	}

	// ─── Location Assignment ───

	async handleAssign(data: PaymentMethodLocationAssignDto, actor: Actor): Promise<EntityRef> {
		// 1. Validate payment method exists
		await this.handleGetById(data.paymentMethodId)

		// 2. Validate location exists
		await this.locationService.handleGetById(data.locationId)

		const result = await this.deps.uow.run(async (tx) => {
			// 3. Upsert assignment
			const written = await this.repo.upsertLocationAssignment(
				{
					paymentMethodId: data.paymentMethodId,
					locationId: data.locationId,
					isEnabled: data.isEnabled,
				},
				tx,
			)
			if (!written) throw LocationAssignmentError.assignFailed()

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'payment-method',
					entity: 'payment_method_location',
					entityId: written.id,
					action: 'create',
					summary: `Assigned payment method #${data.paymentMethodId} to location #${data.locationId} (enabled: ${data.isEnabled})`,
					newValues: {
						paymentMethodId: data.paymentMethodId,
						locationId: data.locationId,
						isEnabled: data.isEnabled,
					},
				}),
				tx,
			)
			return written
		})

		// 4. Invalidate location cache after commit
		await this.cache.deleteFromKeys([locationCacheKey(data.locationId)])
		return result
	}

	async handleUnassign(data: PaymentMethodLocationAssignDto, actor: Actor): Promise<EntityRef> {
		const result = await this.deps.uow.run(async (tx) => {
			// 1. Validate assignment exists
			const existing = await this.repo.findLocationAssignment(
				data.paymentMethodId,
				data.locationId,
				tx,
			)
			if (!existing) {
				throw LocationAssignmentError.notAssigned(data.paymentMethodId, data.locationId)
			}

			// 2. Remove assignment
			const written = await this.repo.removeLocationAssignment(
				data.paymentMethodId,
				data.locationId,
				tx,
			)
			if (!written) {
				throw LocationAssignmentError.notAssigned(data.paymentMethodId, data.locationId)
			}

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'payment-method',
					entity: 'payment_method_location',
					entityId: existing.id,
					action: 'delete',
					summary: `Unassigned payment method #${data.paymentMethodId} from location #${data.locationId}`,
				}),
				tx,
			)
			return written
		})

		// 3. Invalidate location cache after commit
		await this.cache.deleteFromKeys([locationCacheKey(data.locationId)])
		return result
	}
}

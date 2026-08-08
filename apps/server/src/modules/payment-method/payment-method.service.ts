import { paymentMethods } from '@/db/schema/pos.ts'

import { auditLog } from '@/infra/audit/index.ts'
import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { ActorId, EntityRef } from '@/shared/types/utils.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { LocationService } from '@/modules/location/location.service.ts'

import type {
	PaymentMethodCreateDto,
	PaymentMethodDto,
	PaymentMethodFilterDto,
	PaymentMethodLocationAssignDto,
	PaymentMethodUpdateDto,
} from './payment-method.contract.ts'
import { LocationAssignmentError, PaymentMethodError, uniqueFields } from './payment-method.internal.ts'
import type { IPaymentMethodRepo } from './payment-method.repo.ts'

// ─── Cache Keys ───

function locationCacheKey(locationId: number): string {
	return `payment-method:location:${locationId}`
}

// ─── Service ───

export class PaymentMethodService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IPaymentMethodRepo,
		cacheClient: CacheClient,
		private readonly locationService: LocationService,
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

	async handleList(filter: PaymentMethodFilterDto): Promise<WithPaginationResult<PaymentMethodDto>> {
		return this.repo.findPage(filter)
	}

	async handleByLocation(locationId: number): Promise<PaymentMethodDto[]> {
		return this.getByLocation(locationId)
	}

	async handleCreate(data: PaymentMethodCreateDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Check conflicts
		await checkConflict({
			db: this.repo.db,
			table: paymentMethods,
			pkColumn: paymentMethods.id,
			fields: uniqueFields,
			input: data,
		})

		// 2. Insert
		const result = await this.repo.insert({
			...data,
			isActive: data.isActive ? 1 : 0,
			...stampCreate(actorId),
		})
		if (!result) throw PaymentMethodError.createFailed()

		// 3. Invalidate cache
		await this.cache.invalidateStandard()

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'payment-method',
			entity: 'payment_method',
			entityId: result.id,
			action: 'create',
			summary: `Created payment method "${data.name}" (${data.code})`,
			newValues: { code: data.code, name: data.name, type: data.type },
		})

		return result
	}

	async handleUpdate(data: PaymentMethodUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Verify exists
		await this.handleGetById(id)

		// 2. Check conflicts (exclude self)
		await checkConflict({
			db: this.repo.db,
			table: paymentMethods,
			pkColumn: paymentMethods.id,
			fields: uniqueFields,
			input: updateData,
			excludeId: id,
		})

		// 3. Update
		const result = await this.repo.update(id, {
			...updateData,
			isActive: updateData.isActive ? 1 : 0,
			...stampUpdate(actorId),
		})
		if (!result) throw PaymentMethodError.updateFailed(id)

		// 4. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 5. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'payment-method',
			entity: 'payment_method',
			entityId: id,
			action: 'update',
			summary: `Updated payment method "${data.name}" (${data.code})`,
			newValues: { code: data.code, name: data.name, type: data.type },
		})

		return result
	}

	async handleDelete(id: number, actorId: ActorId): Promise<EntityRef> {
		// 1. Verify exists
		const existing = await this.handleGetById(id)

		// 2. Soft-delete
		const result = await this.repo.remove(id, stampUpdate(actorId))
		if (!result) throw PaymentMethodError.deleteFailed(id)

		// 3. Invalidate cache
		await this.cache.invalidateStandard(id)

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'payment-method',
			entity: 'payment_method',
			entityId: id,
			action: 'delete',
			summary: `Deleted payment method "${existing.name}" (${existing.code})`,
		})

		return result
	}

	// ─── Location Assignment ───

	async handleAssign(data: PaymentMethodLocationAssignDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Validate payment method exists
		await this.handleGetById(data.paymentMethodId)

		// 2. Validate location exists
		await this.locationService.handleGetById(data.locationId)

		// 3. Upsert assignment
		const result = await this.repo.upsertLocationAssignment({
			paymentMethodId: data.paymentMethodId,
			locationId: data.locationId,
			isEnabled: data.isEnabled ? 1 : 0,
		})
		if (!result) throw LocationAssignmentError.assignFailed()

		// 4. Invalidate location cache
		await this.cache.deleteFromKeys([locationCacheKey(data.locationId)])

		// 5. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'payment-method',
			entity: 'payment_method_location',
			entityId: result.id,
			action: 'create',
			summary: `Assigned payment method #${data.paymentMethodId} to location #${data.locationId} (enabled: ${data.isEnabled})`,
			newValues: { paymentMethodId: data.paymentMethodId, locationId: data.locationId, isEnabled: data.isEnabled },
		})

		return result
	}

	async handleUnassign(data: PaymentMethodLocationAssignDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Validate assignment exists
		const existing = await this.repo.findLocationAssignment(data.paymentMethodId, data.locationId)
		if (!existing) {
			throw LocationAssignmentError.notAssigned(data.paymentMethodId, data.locationId)
		}

		// 2. Remove assignment
		const result = await this.repo.removeLocationAssignment(data.paymentMethodId, data.locationId)
		if (!result) throw LocationAssignmentError.notAssigned(data.paymentMethodId, data.locationId)

		// 3. Invalidate location cache
		await this.cache.deleteFromKeys([locationCacheKey(data.locationId)])

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'payment-method',
			entity: 'payment_method_location',
			entityId: existing.id,
			action: 'delete',
			summary: `Unassigned payment method #${data.paymentMethodId} from location #${data.locationId}`,
		})

		return result
	}
}

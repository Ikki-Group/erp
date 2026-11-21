import { paymentMethods } from '@/db/schema/pos.ts'

import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { mutate } from '@/shared/service/mutate.ts'
import type { MutationScope } from '@/shared/service/mutate.ts'
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
	private readonly mutation: MutationScope
	private readonly assignmentMutation: MutationScope

	constructor(
		private readonly repo: IPaymentMethodRepo,
		cacheClient: CacheClient,
		private readonly locationService: LocationService,
		deps: PaymentMethodServiceDeps,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'payment-method')
		const scope = { uow: deps.uow, audit: deps.audit, module: 'payment-method' }
		this.mutation = { ...scope, entity: 'payment_method', invalidate: this.cache }
		this.assignmentMutation = { ...scope, entity: 'payment_method_location' }
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
		return mutate(this.mutation, actor, async (tx) => {
			await checkConflict({
				db: tx,
				table: paymentMethods,
				pkColumn: paymentMethods.id,
				fields: uniqueFields,
				input: data,
			})

			const written = await this.repo.insert({ ...data, ...stampCreate(actor.id) }, tx)
			if (!written) throw PaymentMethodError.createFailed()
			return {
				result: written,
				audit: {
					action: 'create',
					summary: `Created payment method "${data.name}" (${data.code})`,
					newValues: { code: data.code, name: data.name, type: data.type },
				},
			}
		})
	}

	async handleUpdate(data: PaymentMethodUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data
		return mutate(this.mutation, actor, async (tx) => {
			const existing = await this.repo.findById(id, tx)
			if (!existing) throw PaymentMethodError.notFound(id)

			await checkConflict({
				db: tx,
				table: paymentMethods,
				pkColumn: paymentMethods.id,
				fields: uniqueFields,
				input: updateData,
				excludeId: id,
			})

			const written = await this.repo.update(id, { ...updateData, ...stampUpdate(actor.id) }, tx)
			if (!written) throw PaymentMethodError.updateFailed(id)
			return {
				result: written,
				audit: {
					action: 'update',
					summary: `Updated payment method "${data.name}" (${data.code})`,
					newValues: { code: data.code, name: data.name, type: data.type },
				},
			}
		})
	}

	async handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		return mutate(this.mutation, actor, async (tx) => {
			const existing = await this.repo.findById(id, tx)
			if (!existing) throw PaymentMethodError.notFound(id)

			const written = await this.repo.remove(id, stampUpdate(actor.id), tx)
			if (!written) throw PaymentMethodError.deleteFailed(id)
			return {
				result: written,
				audit: {
					action: 'delete',
					summary: `Deleted payment method "${existing.name}" (${existing.code})`,
				},
			}
		})
	}

	// ─── Location Assignment ───

	async handleAssign(data: PaymentMethodLocationAssignDto, actor: Actor): Promise<EntityRef> {
		await this.handleGetById(data.paymentMethodId)
		await this.locationService.handleGetById(data.locationId)

		return mutate(
			this.assignmentMutation,
			actor,
			async (tx) => {
				const written = await this.repo.upsertLocationAssignment(
					{
						paymentMethodId: data.paymentMethodId,
						locationId: data.locationId,
						isEnabled: data.isEnabled,
					},
					tx,
				)
				if (!written) throw LocationAssignmentError.assignFailed()
				return {
					result: written,
					audit: {
						action: 'create',
						summary: `Assigned payment method #${data.paymentMethodId} to location #${data.locationId} (enabled: ${data.isEnabled})`,
						newValues: {
							paymentMethodId: data.paymentMethodId,
							locationId: data.locationId,
							isEnabled: data.isEnabled,
						},
					},
				}
			},
			{ invalidate: () => this.cache.deleteFromKeys([locationCacheKey(data.locationId)]) },
		)
	}

	async handleUnassign(data: PaymentMethodLocationAssignDto, actor: Actor): Promise<EntityRef> {
		return mutate(
			this.assignmentMutation,
			actor,
			async (tx) => {
				const existing = await this.repo.findLocationAssignment(
					data.paymentMethodId,
					data.locationId,
					tx,
				)
				if (!existing) {
					throw LocationAssignmentError.notAssigned(data.paymentMethodId, data.locationId)
				}

				const written = await this.repo.removeLocationAssignment(
					data.paymentMethodId,
					data.locationId,
					tx,
				)
				if (!written) {
					throw LocationAssignmentError.notAssigned(data.paymentMethodId, data.locationId)
				}
				return {
					result: written,
					audit: {
						entityId: existing.id,
						action: 'delete',
						summary: `Unassigned payment method #${data.paymentMethodId} from location #${data.locationId}`,
					},
				}
			},
			{ invalidate: () => this.cache.deleteFromKeys([locationCacheKey(data.locationId)]) },
		)
	}
}

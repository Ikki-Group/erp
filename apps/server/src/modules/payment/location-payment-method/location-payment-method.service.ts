import { record } from '@elysiajs/opentelemetry'

import { locationPaymentMethodsTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/infra/cache'
import { checkConflict, type ConflictField, withTransaction } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	LocationPaymentMethodCreateDto,
	LocationPaymentMethodDto,
	LocationPaymentMethodFilterDto,
	LocationPaymentMethodUpdateDto,
} from './location-payment-method.contract'
import { LocationPaymentMethodError } from './location-payment-method.internal'
import type { ILocationPaymentMethodRepo, LocationPaymentMethodInsert, LocationPaymentMethodUpdate } from './location-payment-method.repo'

const uniqueFields: ConflictField<{ locationId: number; paymentMethodId: number }>[] = [
	{
		field: 'locationId',
		column: locationPaymentMethodsTable.locationId,
		message: 'Location payment method already exists for this location',
		code: 'LOCATION_PAYMENT_METHOD_LOCATION_ID_ALREADY_EXISTS',
	},
	{
		field: 'paymentMethodId',
		column: locationPaymentMethodsTable.paymentMethodId,
		message: 'Location payment method already exists for this payment method',
		code: 'LOCATION_PAYMENT_METHOD_PAYMENT_METHOD_ID_ALREADY_EXISTS',
	},
]

type CredentialsType = NonNullable<LocationPaymentMethodInsert['credentials']>
type ConfigType = NonNullable<LocationPaymentMethodInsert['config']>

function toCredentials(obj: Record<string, unknown> | undefined): CredentialsType | null {
	if (!obj) return null
	const result: Record<string, unknown> = {}
	for (const key of Object.keys(obj)) {
		const value = obj[key]
		if (value !== undefined) {
			result[key] = value
		}
	}
	return result as CredentialsType
}

function toConfig(obj: Record<string, unknown> | undefined): ConfigType | null {
	if (!obj) return null
	const result: Record<string, unknown> = {}
	for (const key of Object.keys(obj)) {
		const value = obj[key]
		if (value !== undefined) {
			result[key] = value
		}
	}
	return result as ConfigType
}

export interface LocationReadPort {
	getById(id: number): Promise<{ id: number; type: string } | undefined>
}

export interface PaymentMethodReadPort {
	getById(id: number): Promise<{ id: number } | undefined>
}

interface LocationPaymentMethodServiceDeps {
	location: LocationReadPort
	paymentMethod: PaymentMethodReadPort
}

export class LocationPaymentMethodService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ILocationPaymentMethodRepo,
		cacheClient: CacheClient,
		private readonly deps: LocationPaymentMethodServiceDeps,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'location-payment-method')
	}

	private async invalidate(id?: number, locationId?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		if (locationId !== undefined) keys.push(`byLocation:${locationId}`)
		await this.cache.deleteFromKeys(keys)
	}

	async getById(id: number): Promise<LocationPaymentMethodDto | undefined> {
		return record('LocationPaymentMethodService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.findById(id),
			}),
		)
	}

	async getByLocation(locationId: number): Promise<LocationPaymentMethodDto[]> {
		return record('LocationPaymentMethodService.getByLocation', async () =>
			this.cache.getOrSet({
				key: `byLocation:${locationId}`,
				factory: () => this.repo.findByLocation(locationId),
			}),
		)
	}

	async create(data: LocationPaymentMethodCreateDto, actorId: ActorId): Promise<EntityRef> {
		const location = await this.deps.location.getById(data.locationId)
		if (!location) throw LocationPaymentMethodError.locationNotFound(data.locationId)
		if (location.type !== 'store') throw LocationPaymentMethodError.invalidLocationType()

		const paymentMethod = await this.deps.paymentMethod.getById(data.paymentMethodId)
		if (!paymentMethod) throw LocationPaymentMethodError.paymentMethodNotFound(data.paymentMethodId)

		await checkConflict({
			db: this.repo.db,
			table: locationPaymentMethodsTable,
			pkColumn: locationPaymentMethodsTable.id,
			fields: uniqueFields,
			input: { locationId: data.locationId, paymentMethodId: data.paymentMethodId },
		})

		const result = await withTransaction(this.repo.db, async (tx) => {
			if (data.isDefault) {
				await this.repo.unsetDefaultForLocation(data.locationId, tx)
			}

			const insertData: LocationPaymentMethodInsert = {
				locationId: data.locationId,
				paymentMethodId: data.paymentMethodId,
				paymentProviderId: data.paymentProviderId ?? null,
				isEnabled: data.isEnabled ?? true,
				isDefault: data.isDefault ?? false,
				credentials: toCredentials(data.credentials),
				config: toConfig(data.config),
				enabledAt: (data.isEnabled ?? true) ? new Date() : null,
				...stampCreate(actorId),
			}

			const created = await this.repo.insert(insertData, tx)
			if (!created) throw LocationPaymentMethodError.createFailed()
			return created
		})

		await this.invalidate(undefined, data.locationId)
		return result
	}

	async update(data: LocationPaymentMethodUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id } = data
		const existing = await this.repo.findById(id)
		if (!existing) throw LocationPaymentMethodError.notFound(id)

		await checkConflict({
			db: this.repo.db,
			table: locationPaymentMethodsTable,
			pkColumn: locationPaymentMethodsTable.id,
			fields: uniqueFields,
			input: { locationId: data.locationId, paymentMethodId: data.paymentMethodId },
			existing: { id: existing.id, locationId: existing.locationId, paymentMethodId: existing.paymentMethodId },
		})

		const result = await withTransaction(this.repo.db, async (tx) => {
			if (data.isDefault && !existing.isDefault) {
				await this.repo.unsetDefaultForLocation(existing.locationId, tx)
			}

			const updateData: LocationPaymentMethodUpdate = {
				locationId: data.locationId,
				paymentMethodId: data.paymentMethodId,
				paymentProviderId: data.paymentProviderId ?? null,
				isEnabled: data.isEnabled ?? existing.isEnabled,
				isDefault: data.isDefault ?? existing.isDefault,
				credentials: toCredentials(data.credentials),
				config: toConfig(data.config),
				...stampUpdate(actorId),
			}
			
			if (data.isEnabled !== undefined && data.isEnabled !== existing.isEnabled) {
				updateData.enabledAt = data.isEnabled ? new Date() : null
			}

			const updated = await this.repo.update(id, updateData, tx)
			if (!updated) throw LocationPaymentMethodError.notFound(id)
			return updated
		})

		await this.invalidate(id, existing.locationId)
		return result
	}

	async remove(id: number): Promise<EntityRef> {
		const existing = await this.repo.findById(id)
		if (!existing) throw LocationPaymentMethodError.notFound(id)

		const result = await this.repo.remove(id)
		if (!result) throw LocationPaymentMethodError.notFound(id)

		await this.invalidate(id, existing.locationId)
		return result
	}

	async handleList(
		filter: LocationPaymentMethodFilterDto,
	): Promise<WithPaginationResult<LocationPaymentMethodDto>> {
		return record('LocationPaymentMethodService.handleList', async () => this.repo.findPage(filter))
	}

	async handleGetById(id: number): Promise<LocationPaymentMethodDto> {
		return record('LocationPaymentMethodService.handleGetById', async () => {
			const result = await this.getById(id)
			if (!result) throw LocationPaymentMethodError.notFound(id)
			return result
		})
	}

	async handleGetByLocation(locationId: number): Promise<LocationPaymentMethodDto[]> {
		return record('LocationPaymentMethodService.handleGetByLocation', async () =>
			this.getByLocation(locationId),
		)
	}

	async handleCreate(data: LocationPaymentMethodCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('LocationPaymentMethodService.handleCreate', async () => this.create(data, actorId))
	}

	async handleUpdate(data: LocationPaymentMethodUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('LocationPaymentMethodService.handleUpdate', async () => this.update(data, actorId))
	}

	async handleRemove(id: number): Promise<EntityRef> {
		return record('LocationPaymentMethodService.handleRemove', async () => this.remove(id))
	}
}

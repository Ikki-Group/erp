// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */

import { CacheService, type CacheClient } from '@/infra/cache'

import { customersTable } from '@/db/schema'

import { checkConflict, type ConflictField} from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

import type { ActorId, EntityRef } from '@/shared/types/utils'

import { CustomerRepo } from './customer.repo'
import type {
	CustomerDto,
	CustomerCreateSchema,
	CustomerUpdateSchema,
	CustomerFilterSchema,
	CustomerAddPointsSchema,
	CustomerRedeemPointsSchema,
	CustomerLoyaltyTransactionSchema,
} from './customer.contract'

const uniqueFields: ConflictField<'code' | 'name' | 'phone'>[] = [
	{
		field: 'code',
		column: customersTable.code,
		message: 'Customer code already exists',
		code: 'CUSTOMER_CODE_ALREADY_EXISTS',
	},
	{
		field: 'name',
		column: customersTable.name,
		message: 'Customer name already exists',
		code: 'CUSTOMER_NAME_ALREADY_EXISTS',
	},
	{
		field: 'phone',
		column: customersTable.phone,
		message: 'Customer phone already exists',
		code: 'CUSTOMER_PHONE_ALREADY_EXISTS',
	},
]

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Customer with ID ${id} not found`, { code: 'CUSTOMER_NOT_FOUND' }),
	notFoundByPhone: (phone: string) =>
		new NotFoundError(`Customer with phone ${phone} not found`, { code: 'CUSTOMER_NOT_FOUND' }),
	createFailed: () => new InternalServerError('Customer creation failed', { code: 'CUSTOMER_CREATE_FAILED' }),
	insufficientPoints: () =>
		new InternalServerError('Insufficient points balance', { code: 'INSUFFICIENT_POINTS' }),
}

export class CustomerService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: CustomerRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'customer')
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<CustomerDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: `byId:${id}`,
			factory: () => this.repo.getById(id),
		})
	}

	async getByPhone(phone: string): Promise<CustomerDto | undefined> {
		return this.repo.getByPhone(phone)
	}

	async getLoyaltyHistory(customerId: number): Promise<CustomerLoyaltyTransactionSchema[]> {
		return this.repo.getLoyaltyHistory(customerId)
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: CustomerFilterSchema): Promise<WithPaginationResult<CustomerDto>> {
		const result = await this.repo.getListPaginated(filter)
		return result
	}

	async handleDetail(id: number): Promise<CustomerDto> {
		const result = await this.repo.getById(id)
		if (!result) throw err.notFound(id)
		return result
	}

	async handleGetByPhone(phone: string): Promise<CustomerDto> {
		const result = await this.repo.getByPhone(phone)
		if (!result) throw err.notFoundByPhone(phone)
		return result
	}

	async handleCreate(data: CustomerCreateSchema, actorId: ActorId): Promise<EntityRef> {
		await checkConflict({
			table: customersTable,
			pkColumn: customersTable.id,
			fields: uniqueFields,
			input: { code: data.code, name: data.name, phone: data.phone } as Record<
				'code' | 'name' | 'phone',
				unknown
			>,
		})
		const result = await this.repo.create(data, actorId)

		await this.cache.deleteMany({ keys: ['list', 'count'] })

		return result
	}

	async handleUpdate(data: CustomerUpdateSchema, actorId: ActorId): Promise<EntityRef> {
		const { id } = data

		const existing = await this.getById(id)
		if (!existing) throw err.notFound(id)

		await checkConflict({
			table: customersTable,
			pkColumn: customersTable.id,
			fields: uniqueFields,
			input: data as unknown as Record<'code' | 'name' | 'phone', unknown>,
			existing: existing as unknown as { id: number } & Record<'code' | 'name' | 'phone', unknown>,
		})

		const result = await this.repo.update(data, actorId)

		await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

		return result
	}

	async handleRemove(id: number): Promise<EntityRef> {
		const result = await this.repo.remove(id)
		if (!result.id) throw err.notFound(id)

		await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

		return result
	}

	async handleAddPoints(data: CustomerAddPointsSchema, actorId: ActorId): Promise<EntityRef> {
		const existing = await this.getById(data.customerId)
		if (!existing) throw err.notFound(data.customerId)

		// Update last visit when adding points (typically from a sale)
		await this.repo.updateLastVisit(data.customerId)

		const result = await this.repo.addPoints(data, actorId)
		if (!result.id) throw err.createFailed()

		await this.cache.deleteMany({ keys: [`byId:${data.customerId}`] })

		return result
	}

	async handleRedeemPoints(data: CustomerRedeemPointsSchema, actorId: ActorId): Promise<EntityRef> {
		const existing = await this.getById(data.customerId)
		if (!existing) throw err.notFound(data.customerId)

		const result = await this.repo.redeemPoints(data, actorId)
		if (!result.id) throw err.insufficientPoints()

		await this.cache.deleteMany({ keys: [`byId:${data.customerId}`] })

		return result
	}
}

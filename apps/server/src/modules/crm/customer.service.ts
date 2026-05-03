/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
import { record } from '@elysiajs/opentelemetry'

import { checkConflict, type ConflictField, type WithPaginationResult } from '@/core/database'
import { InternalServerError, NotFoundError } from '@/core/http/errors'

import { customersTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/lib/cache'
import type { RecordId } from '@/lib/validation'

import * as dto from './customer.dto'
import { CustomerRepo } from './customer.repo'

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
		new NotFoundError(`Customer with ID ${id} not found`, 'CUSTOMER_NOT_FOUND'),
	notFoundByPhone: (phone: string) =>
		new NotFoundError(`Customer with phone ${phone} not found`, 'CUSTOMER_NOT_FOUND'),
	createFailed: () => new InternalServerError('Customer creation failed', 'CUSTOMER_CREATE_FAILED'),
	insufficientPoints: () =>
		new InternalServerError('Insufficient points balance', 'INSUFFICIENT_POINTS'),
}

export class CustomerService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: CustomerRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'customer', client: cacheClient })
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<dto.CustomerDto | undefined> {
		return record('CustomerService.getById', async () => {
			return this.cache.getOrSetSkipUndefined({
				key: `byId:${id}`,
				factory: () => this.repo.getById(id),
			})
		})
	}

	async getByPhone(phone: string): Promise<dto.CustomerDto | undefined> {
		return record('CustomerService.getByPhone', async () => {
			return this.repo.getByPhone(phone)
		})
	}

	async getLoyaltyHistory(customerId: number): Promise<dto.CustomerLoyaltyTransactionDto[]> {
		return record('CustomerService.getLoyaltyHistory', async () => {
			return this.repo.getLoyaltyHistory(customerId)
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: dto.CustomerFilterDto): Promise<WithPaginationResult<dto.CustomerDto>> {
		return record('CustomerService.handleList', async () => {
			const result = await this.repo.getListPaginated(filter)
			return result
		})
	}

	async handleDetail(id: number): Promise<dto.CustomerDto> {
		return record('CustomerService.handleDetail', async () => {
			const result = await this.repo.getById(id)
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleGetByPhone(phone: string): Promise<dto.CustomerDto> {
		return record('CustomerService.handleGetByPhone', async () => {
			const result = await this.repo.getByPhone(phone)
			if (!result) throw err.notFoundByPhone(phone)
			return result
		})
	}

	async handleCreate(data: dto.CustomerCreateDto, actorId: number): Promise<RecordId> {
		return record('CustomerService.handleCreate', async () => {
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
			if (!result) throw err.createFailed()

			await this.cache.deleteMany({ keys: ['list', 'count'] })

			return { id: result }
		})
	}

	async handleUpdate(data: dto.CustomerUpdateDto, actorId: number): Promise<RecordId> {
		return record('CustomerService.handleUpdate', async () => {
			const { id } = data

			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			await checkConflict({
				table: customersTable,
				pkColumn: customersTable.id,
				fields: uniqueFields,
				input: data as unknown as Record<'code' | 'name' | 'phone', unknown>,
				existing: existing as unknown as { id: number } & Record<
					'code' | 'name' | 'phone',
					unknown
				>,
			})

			const result = await this.repo.update(data, actorId)
			if (!result) throw err.notFound(id)

			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

			return { id: result }
		})
	}

	async handleRemove(id: number): Promise<RecordId> {
		return record('CustomerService.handleRemove', async () => {
			const result = await this.repo.remove(id)
			if (!result) throw err.notFound(id)

			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

			return { id }
		})
	}

	async handleAddPoints(data: dto.CustomerAddPointsDto, actorId: number): Promise<RecordId> {
		return record('CustomerService.handleAddPoints', async () => {
			const existing = await this.getById(data.customerId)
			if (!existing) throw err.notFound(data.customerId)

			// Update last visit when adding points (typically from a sale)
			await this.repo.updateLastVisit(data.customerId)

			const result = await this.repo.addPoints(data, actorId)
			if (!result) throw err.createFailed()

			await this.cache.deleteMany({ keys: [`byId:${data.customerId}`] })

			return { id: result }
		})
	}

	async handleRedeemPoints(data: dto.CustomerRedeemPointsDto, actorId: number): Promise<RecordId> {
		return record('CustomerService.handleRedeemPoints', async () => {
			const existing = await this.getById(data.customerId)
			if (!existing) throw err.notFound(data.customerId)

			const result = await this.repo.redeemPoints(data, actorId)
			if (!result) throw err.insufficientPoints()

			await this.cache.deleteMany({ keys: [`byId:${data.customerId}`] })

			return { id: result }
		})
	}
}

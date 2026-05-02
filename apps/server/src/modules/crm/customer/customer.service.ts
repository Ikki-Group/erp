import { record } from '@elysiajs/opentelemetry'

import { checkConflict, type ConflictField, type WithPaginationResult } from '@/core/database'
import { InternalServerError, NotFoundError } from '@/core/http/errors'
import type { RecordId } from '@/core/validation'

import { customersTable } from '@/db/schema'

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
	constructor(private readonly repo: CustomerRepo) {}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<dto.CustomerDto | undefined> {
		return record('CustomerService.getById', async () => {
			return this.repo.getById(id)
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

			return { id: result }
		})
	}

	async handleUpdate(data: dto.CustomerUpdateDto, actorId: number): Promise<RecordId> {
		return record('CustomerService.handleUpdate', async () => {
			const { id } = data

			const existing: dto.CustomerDto = await this.repo.getById(id)
			if (!existing) throw err.notFound(id)

			await checkConflict({
				table: customersTable,
				pkColumn: customersTable.id,
				fields: uniqueFields,
				input: { code: data.code, name: data.name, phone: data.phone } as Record<
					'code' | 'name' | 'phone',
					unknown
				>,
				existing: { id, code: existing.code, name: existing.name, phone: existing.phone },
			})

			const result = await this.repo.update(data, actorId)
			if (!result) throw err.notFound(id)

			return { id }
		})
	}

	async handleRemove(id: number): Promise<RecordId> {
		return record('CustomerService.handleRemove', async () => {
			const result = await this.repo.remove(id)
			if (!result) throw err.notFound(id)
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

			return { id: result }
		})
	}

	async handleRedeemPoints(data: dto.CustomerRedeemPointsDto, actorId: number): Promise<RecordId> {
		return record('CustomerService.handleRedeemPoints', async () => {
			const existing = await this.getById(data.customerId)
			if (!existing) throw err.notFound(data.customerId)

			const result = await this.repo.redeemPoints(data, actorId)
			if (!result) throw err.insufficientPoints()

			return { id: result }
		})
	}
}

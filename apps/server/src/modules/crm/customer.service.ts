import { record } from '@elysiajs/opentelemetry'

import { customersTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/infra/cache'
import { checkConflict, type ConflictField, withTransaction } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	CustomerDto,
	CustomerCreateDto,
	CustomerUpdateDto,
	CustomerFilterDto,
	CustomerAddPointsDto,
	CustomerRedeemPointsDto,
	CustomerLoyaltyTransactionDto,
} from './customer.contract'
import { CustomerError } from './customer.internal'
import type { ICustomerRepo } from './customer.repo'

const uniqueFields: ConflictField<{ code: string; name: string; phone: string | null }>[] = [
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

export class CustomerService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ICustomerRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'customer')
	}

	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		await this.cache.deleteFromKeys(keys)
	}

	async getById(id: number): Promise<CustomerDto | undefined> {
		return record('CustomerService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.findById(id),
			}),
		)
	}

	async getByPhone(phone: string): Promise<CustomerDto | undefined> {
		return this.repo.findByPhone(phone)
	}

	async getLoyaltyHistory(customerId: number): Promise<CustomerLoyaltyTransactionDto[]> {
		return this.repo.findLoyaltyHistory(customerId)
	}

	async create(data: CustomerCreateDto, actorId: ActorId): Promise<EntityRef> {
		await checkConflict({
			db: this.repo.db,
			table: customersTable,
			pkColumn: customersTable.id,
			fields: uniqueFields,
			input: {
				code: data.code,
				name: data.name,
				phone: data.phone ?? null,
			},
		})

		const result = await this.repo.insert(data, actorId)
		if (!result) throw CustomerError.createFailed()

		await this.invalidate()
		return result
	}

	async update(data: CustomerUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id } = data
		const existing = await this.repo.findById(id)
		if (!existing) throw CustomerError.notFound(id)

		await checkConflict({
			db: this.repo.db,
			table: customersTable,
			pkColumn: customersTable.id,
			fields: uniqueFields,
			input: {
				code: existing.code,
				name: data.name ?? existing.name,
				phone: data.phone ?? existing.phone,
			},
			existing,
		})

		const result = await this.repo.update(id, data, actorId)
		if (!result) throw CustomerError.notFound(id)

		await this.invalidate(id)
		return result
	}

	async remove(id: number): Promise<EntityRef> {
		const result = await this.repo.remove(id)
		if (!result) throw CustomerError.notFound(id)

		await this.invalidate(id)
		return result
	}

	async addPoints(data: CustomerAddPointsDto, actorId: ActorId): Promise<EntityRef> {
		const existing = await this.repo.findById(data.customerId)
		if (!existing) throw CustomerError.notFound(data.customerId)

		const result = await withTransaction(this.repo.db, async (tx) => {
			await this.repo.updateLastVisit(data.customerId, tx)
			const txnResult = await this.repo.addPoints(data, actorId, tx)
			if (!txnResult) throw CustomerError.createFailed()
			return txnResult
		})

		await this.invalidate(data.customerId)
		return result
	}

	async redeemPoints(data: CustomerRedeemPointsDto, actorId: ActorId): Promise<EntityRef> {
		const existing = await this.repo.findById(data.customerId)
		if (!existing) throw CustomerError.notFound(data.customerId)

		if (existing.pointsBalance < data.points) {
			throw CustomerError.insufficientPoints()
		}

		const result = await withTransaction(this.repo.db, async (tx) => {
			const txnResult = await this.repo.redeemPoints(data, actorId, tx)
			if (!txnResult) throw CustomerError.insufficientPoints()
			return txnResult
		})

		await this.invalidate(data.customerId)
		return result
	}

	async handleList(filter: CustomerFilterDto): Promise<WithPaginationResult<CustomerDto>> {
		return record('CustomerService.handleList', async () => this.repo.findPage(filter))
	}

	async handleGetById(id: number): Promise<CustomerDto> {
		return record('CustomerService.handleGetById', async () => {
			const result = await this.getById(id)
			if (!result) throw CustomerError.notFound(id)
			return result
		})
	}

	async handleGetByPhone(phone: string): Promise<CustomerDto> {
		return record('CustomerService.handleGetByPhone', async () => {
			const result = await this.repo.findByPhone(phone)
			if (!result) throw CustomerError.notFoundByPhone(phone)
			return result
		})
	}

	async handleCreate(data: CustomerCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('CustomerService.handleCreate', async () => this.create(data, actorId))
	}

	async handleUpdate(data: CustomerUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('CustomerService.handleUpdate', async () => this.update(data, actorId))
	}

	async handleRemove(id: number): Promise<EntityRef> {
		return record('CustomerService.handleRemove', async () => this.remove(id))
	}

	async handleAddPoints(data: CustomerAddPointsDto, actorId: ActorId): Promise<EntityRef> {
		return record('CustomerService.handleAddPoints', async () => this.addPoints(data, actorId))
	}

	async handleRedeemPoints(data: CustomerRedeemPointsDto, actorId: ActorId): Promise<EntityRef> {
		return record('CustomerService.handleRedeemPoints', async () =>
			this.redeemPoints(data, actorId),
		)
	}

	async handleLoyaltyHistory(customerId: number): Promise<CustomerLoyaltyTransactionDto[]> {
		return record('CustomerService.handleLoyaltyHistory', async () =>
			this.repo.findLoyaltyHistory(customerId),
		)
	}
}

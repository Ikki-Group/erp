import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'
import { RelationMap } from '@/shared/utils'
import { checkConflict, type ConflictField } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'
import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

import { paymentMethodsTable } from '@/db/schema'

import * as dto from './payment-method.dto'
import { PaymentMethodRepo } from './payment-method.repo'

const uniqueFields: ConflictField<{ name: string }>[] = [
	{
		field: 'name',
		column: paymentMethodsTable.name,
		message: 'Payment method name already exists',
		code: 'PAYMENT_METHOD_NAME_ALREADY_EXISTS',
	},
]

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Payment method with ID ${id} not found`, { code: 'PAYMENT_METHOD_NOT_FOUND' }),
	createFailed: () =>
		new InternalServerError('Payment method creation failed', { code: 'PAYMENT_METHOD_CREATE_FAILED' }),
}

export class PaymentMethodService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: PaymentMethodRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'payment-method')
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getList(): Promise<dto.PaymentMethodDto[]> {
		return record('PaymentMethodService.getList', async () => {
			return this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.repo.getList(),
			})
		})
	}

	async getEnabled(): Promise<dto.PaymentMethodDto[]> {
		return record('PaymentMethodService.getEnabled', async () => {
			return this.repo.getEnabled()
		})
	}

	async getGlobal(): Promise<dto.PaymentMethodDto[]> {
		return record('PaymentMethodService.getGlobal', async () => {
			return this.cache.getOrSet({
				key: 'global',  // Custom key (not in default keys)
				factory: () => this.repo.getGlobal(),
			})
		})
	}

	async getRelationMap(): Promise<RelationMap<number, dto.PaymentMethodDto>> {
		return record('PaymentMethodService.getRelationMap', async () => {
			const methods = await this.getList()
			return RelationMap.fromArray(methods, (c) => c.id)
		})
	}

	async getById(id: number): Promise<dto.PaymentMethodDto | undefined> {
		return record('PaymentMethodService.getById', async () => {
			return this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.getById(id),
			})
		})
	}

	async count(): Promise<number> {
		return record('PaymentMethodService.count', async () => {
			return this.cache.getOrSet({
				key: this.cache.keys.count,
				factory: () => this.repo.count(),
			})
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: dto.PaymentMethodFilterDto,
	): Promise<WithPaginationResult<dto.PaymentMethodDto>> {
		return record('PaymentMethodService.handleList', async () => {
			const result = await this.repo.getListPaginated(filter)
			return result
		})
	}

	async handleDetail(id: number): Promise<dto.PaymentMethodDto> {
		return record('PaymentMethodService.handleDetail', async () => {
			const result = await this.repo.getById(id)
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleCreate(data: dto.PaymentMethodCreateDto, actorId: number): Promise<EntityRef> {
		return record('PaymentMethodService.handleCreate', async () => {
			await checkConflict({
				table: paymentMethodsTable,
				pkColumn: paymentMethodsTable.id,
				fields: uniqueFields,
				input: data,
			})
			const result = await this.repo.create(data, actorId)
			if (!result) throw err.createFailed()
			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count, 'global'])
			return { id: result }
		})
	}

	async handleUpdate(data: dto.PaymentMethodUpdateDto, actorId: number): Promise<EntityRef> {
		return record('PaymentMethodService.handleUpdate', async () => {
			const { id } = data

			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			await checkConflict({
				table: paymentMethodsTable,
				pkColumn: paymentMethodsTable.id,
				fields: uniqueFields,
				input: data,
				existing,
			})

			const result = await this.repo.update(data, actorId)
			if (!result) throw err.notFound(id)
			await this.cache.deleteFromKeys([
				this.cache.keys.list,
				this.cache.keys.count,
				'global',
				this.cache.keys.byId(id),
			])
			return { id }
		})
	}

	async handleRemove(id: number): Promise<EntityRef> {
		return record('PaymentMethodService.handleRemove', async () => {
			const result = await this.repo.remove(id)
			if (!result) throw err.notFound(id)
			await this.cache.deleteFromKeys([
				this.cache.keys.list,
				this.cache.keys.count,
				'global',
				this.cache.keys.byId(id),
			])
			return { id }
		})
	}

	async seed(data: (dto.PaymentMethodCreateDto & { createdBy: number })[]): Promise<void> {
		return record('PaymentMethodService.seed', async () => {
			await this.repo.seed(data)
			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count, 'global'])
		})
	}

	async seedDefault(actorId: number): Promise<void> {
		return record('PaymentMethodService.seedDefault', async () => {
			const defaultPaymentMethods: (dto.PaymentMethodCreateDto & { createdBy: number })[] = [
				{
					type: 'cash',
					category: 'cash',
					name: 'Tunai',
					isEnabled: true,
					isDefault: true,
					isGlobal: true,
					paymentProviderId: null,
					createdBy: actorId,
				},
				{
					type: 'e_wallet',
					category: 'cashless',
					name: 'QRIS BCA',
					isEnabled: true,
					isDefault: false,
					isGlobal: true,
					paymentProviderId: null,
					createdBy: actorId,
				},
				{
					type: 'e_wallet',
					category: 'cashless',
					name: 'QRIS Mandiri',
					isEnabled: true,
					isDefault: false,
					isGlobal: true,
					paymentProviderId: null,
					createdBy: actorId,
				},
				{
					type: 'debit_card',
					category: 'cashless',
					name: 'EDC BCA',
					isEnabled: true,
					isDefault: false,
					isGlobal: false,
					paymentProviderId: null,
					createdBy: actorId,
				},
			]
			await this.seed(defaultPaymentMethods)
		})
	}
}

import { record } from '@elysiajs/opentelemetry'

import { checkConflict, type ConflictField, type WithPaginationResult } from '@/core/database'
import { InternalServerError, NotFoundError } from '@/core/http/errors'
import { RelationMap } from '@/core/utils/relation-map'

import { paymentsTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/lib/cache'
import type { RecordId } from '@/lib/validation'

import * as dto from './payment.dto'
import { PaymentRepo } from './payment.repo'

const uniqueFields: ConflictField<'referenceNo'>[] = [
	{
		field: 'referenceNo',
		column: paymentsTable.referenceNo,
		message: 'Payment reference number already exists',
		code: 'PAYMENT_REFERENCE_NO_ALREADY_EXISTS',
	},
]

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Payment with ID ${id} not found`, 'PAYMENT_NOT_FOUND'),
	createFailed: () => new InternalServerError('Payment creation failed', 'PAYMENT_CREATE_FAILED'),
}

export class PaymentService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: PaymentRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'payment', client: cacheClient })
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getList(): Promise<dto.PaymentDto[]> {
		return record('PaymentService.getList', async () => {
			return this.cache.getOrSet({
				key: 'list',
				factory: () => this.repo.getList(),
			})
		})
	}

	async getRelationMap(): Promise<RelationMap<number, dto.PaymentDto>> {
		return record('PaymentService.getRelationMap', async () => {
			const payments = await this.getList()
			return RelationMap.fromArray(payments, (p) => p.id)
		})
	}

	async getById(id: number): Promise<dto.PaymentDto | undefined> {
		return record('PaymentService.getById', async () => {
			return this.cache.getOrSetSkipUndefined({
				key: `byId:${id}`,
				factory: () => this.repo.getById(id),
			})
		})
	}

	async count(): Promise<number> {
		return record('PaymentService.count', async () => {
			return this.cache.getOrSet({
				key: 'count',
				factory: () => this.repo.count(),
			})
		})
	}

	async getPaymentInvoices(paymentId: number): Promise<dto.PaymentInvoiceDto[]> {
		return record('PaymentService.getPaymentInvoices', async () => {
			return this.repo.getPaymentInvoicesByPaymentId(paymentId)
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: dto.PaymentFilterDto): Promise<WithPaginationResult<dto.PaymentDto>> {
		return record('PaymentService.handleList', async () => {
			const result = await this.repo.getListPaginated(filter)
			return result
		})
	}

	async handleDetail(id: number): Promise<dto.PaymentDto> {
		return record('PaymentService.handleDetail', async () => {
			const result = await this.repo.getById(id)
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleCreate(data: dto.PaymentCreateDto, actorId: number): Promise<RecordId> {
		return record('PaymentService.handleCreate', async () => {
			await checkConflict({
				table: paymentsTable,
				pkColumn: paymentsTable.id,
				fields: uniqueFields,
				input: data,
			})
			const result = await this.repo.create(data, actorId)
			if (!result) throw err.createFailed()
			await this.cache.deleteMany({ keys: ['list', 'count'] })
			return { id: result }
		})
	}

	async handleUpdate(data: dto.PaymentUpdateDto, actorId: number): Promise<RecordId> {
		return record('PaymentService.handleUpdate', async () => {
			const { id } = data

			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			await checkConflict({
				table: paymentsTable,
				pkColumn: paymentsTable.id,
				fields: uniqueFields,
				input: data,
				existing,
			})

			const result = await this.repo.update(data, actorId)
			if (!result) throw err.notFound(id)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
			return { id }
		})
	}

	async handleRemove(id: number): Promise<RecordId> {
		return record('PaymentService.handleRemove', async () => {
			const result = await this.repo.remove(id)
			if (!result) throw err.notFound(id)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
			return { id }
		})
	}
}

import { record } from '@elysiajs/opentelemetry'

import { paymentsTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/infra/cache'
import { checkConflict, type ConflictField } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'
import { RelationMap } from '@/shared/utils'

import type {
	PaymentCreateDto,
	PaymentDto,
	PaymentFilterDto,
	PaymentInvoiceDto,
	PaymentUpdateDto,
} from './payment.contract'
import { PaymentError } from './payment.internal'
import type { IPaymentRepo } from './payment.repo'

const uniqueFields: ConflictField<{ referenceNo?: string | null }>[] = [
	{
		field: 'referenceNo',
		column: paymentsTable.referenceNo,
		message: 'Payment reference number already exists',
		code: 'PAYMENT_REFERENCE_NO_ALREADY_EXISTS',
	},
]

export class PaymentService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IPaymentRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'payment')
	}

	toRelationMap(items: PaymentDto[]): RelationMap<number, PaymentDto> {
		return RelationMap.fromArray(items, (p) => p.id)
	}

	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		await this.cache.deleteFromKeys(keys)
	}

	async getListAll(): Promise<PaymentDto[]> {
		return record('PaymentService.getListAll', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.repo.findMany(),
			}),
		)
	}

	async getById(id: number): Promise<PaymentDto | undefined> {
		return record('PaymentService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.findById(id),
			}),
		)
	}

	async getRelationMap(): Promise<RelationMap<number, PaymentDto>> {
		return record('PaymentService.getRelationMap', async () => {
			const payments = await this.getListAll()
			return this.toRelationMap(payments)
		})
	}

	async getPaymentInvoices(paymentId: number): Promise<PaymentInvoiceDto[]> {
		return this.repo.findPaymentInvoicesByPaymentId(paymentId)
	}

	async create(data: PaymentCreateDto, actorId: ActorId): Promise<EntityRef> {
		await checkConflict({
			db: this.repo.db,
			table: paymentsTable,
			pkColumn: paymentsTable.id,
			fields: uniqueFields,
			input: data,
		})

		const result = await this.repo.insert({
			...data,
			amount: typeof data.amount === 'string' ? data.amount : String(data.amount),
			...stampCreate(actorId),
		})
		if (!result) throw PaymentError.createFailed()

		await this.invalidate()
		return result
	}

	async update(data: PaymentUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id } = data
		const existing = await this.getById(id)
		if (!existing) throw PaymentError.notFound(id)

		await checkConflict({
			db: this.repo.db,
			table: paymentsTable,
			pkColumn: paymentsTable.id,
			fields: uniqueFields,
			input: data,
			existing,
		})

		const result = await this.repo.update(id, {
			...data,
			amount: typeof data.amount === 'string' ? data.amount : String(data.amount),
			...stampUpdate(actorId),
		})
		if (!result) throw PaymentError.notFound(id)

		await this.invalidate(id)
		return result
	}

	async remove(id: number): Promise<EntityRef> {
		const result = await this.repo.remove(id)
		if (!result) throw PaymentError.notFound(id)

		await this.invalidate(id)
		return result
	}

	async handleList(filter: PaymentFilterDto): Promise<WithPaginationResult<PaymentDto>> {
		return record('PaymentService.handleList', async () => this.repo.findPage(filter))
	}

	async handleDetail(id: number): Promise<PaymentDto> {
		return record('PaymentService.handleDetail', async () => {
			const result = await this.getById(id)
			if (!result) throw PaymentError.notFound(id)
			return result
		})
	}

	async handleCreate(data: PaymentCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('PaymentService.handleCreate', async () => this.create(data, actorId))
	}

	async handleUpdate(data: PaymentUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('PaymentService.handleUpdate', async () => this.update(data, actorId))
	}

	async handleRemove(id: number): Promise<EntityRef> {
		return record('PaymentService.handleRemove', async () => this.remove(id))
	}
}

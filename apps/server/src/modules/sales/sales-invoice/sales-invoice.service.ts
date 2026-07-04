import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'
import { withTransaction } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'
import { RelationMap } from '@/shared/utils'

import type {
	SalesInvoiceDto,
	SalesInvoiceFilterDto,
	SalesInvoiceWithItemsDto,
	SalesInvoiceCreateDto,
	SalesInvoiceUpdateDto,
	SalesInvoiceGenerateDto,
} from './sales-invoice.contract'
import { SalesInvoiceError } from './sales-invoice.internal'
import type { ISalesInvoiceRepo } from './sales-invoice.repo'

export interface ISalesOrderPort {
	findById(orderId: number): Promise<{ id: number; status: string } | undefined>
	findItemsByOrderId(orderId: number, db: DbContext): Promise<
		Array<{
			id: number
			productId: number | null
			variantId: number | null
			itemName: string
			quantity: string
			unitPrice: string
			taxAmount: string
			discountAmount: string
			subtotal: string
		}>
	>
}

export class SalesInvoiceService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ISalesInvoiceRepo,
		private readonly salesOrder: ISalesOrderPort,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'sales.invoice')
	}

	toRelationMap(items: SalesInvoiceDto[]): RelationMap<number, SalesInvoiceDto> {
		return RelationMap.fromArray(items, (v) => v.id)
	}

	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) {
			keys.push(this.cache.keys.byId(id))
		}
		await this.cache.deleteFromKeys(keys)
	}

	async getById(id: number): Promise<SalesInvoiceDto | undefined> {
		return record('SalesInvoiceService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.findById(id),
			}),
		)
	}

	async handleList(
		filter: SalesInvoiceFilterDto,
	): Promise<WithPaginationResult<SalesInvoiceDto>> {
		return record('SalesInvoiceService.handleList', async () =>
			this.cache.getOrSet({
				key: `${this.cache.keys.list}.${JSON.stringify(filter)}`,
				factory: () => this.repo.findPage(filter),
			}),
		)
	}

	async handleDetail(id: number): Promise<SalesInvoiceDto> {
		return record('SalesInvoiceService.handleDetail', async () => {
			const result = await this.repo.findById(id)
			if (!result) throw SalesInvoiceError.notFound(id)
			return result
		})
	}

	async handleDetailWithItems(id: number): Promise<SalesInvoiceWithItemsDto> {
		return record('SalesInvoiceService.handleDetailWithItems', async () => {
			const result = await this.repo.findWithItems(id)
			if (!result) throw SalesInvoiceError.notFound(id)
			return result
		})
	}

	async handleCreate(data: SalesInvoiceCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('SalesInvoiceService.handleCreate', async () => {
			const result = await this.repo.insert(
				{
					...data,
					status: 'draft',
					invoiceDate: new Date(),
					totalAmount: '0',
					taxAmount: '0',
					discountAmount: '0',
					...stampCreate(actorId),
				},
				this.repo.db,
			)
			if (!result) throw SalesInvoiceError.createFailed()

			await this.invalidate()
			return result
		})
	}

	async handleGenerateFromOrder(
		data: SalesInvoiceGenerateDto,
		actorId: ActorId,
	): Promise<EntityRef> {
		return record('SalesInvoiceService.handleGenerateFromOrder', async () => {
			const existing = await this.repo.findByOrderId(data.orderId)
			if (existing) {
				throw SalesInvoiceError.generateFailed()
			}

			const order = await this.salesOrder.findById(data.orderId)
			if (!order) {
				throw SalesInvoiceError.generateFailed()
			}

			const result = await withTransaction(this.repo.db, async (tx) => {
				const invoiceRef = await this.repo.insert(
					{
						orderId: data.orderId,
						locationId: data.locationId,
						customerId: data.customerId ?? null,
						status: 'draft',
						invoiceDate: new Date(),
						dueDate: data.dueDate ?? null,
						notes: data.notes ?? null,
						totalAmount: '0',
						taxAmount: '0',
						discountAmount: '0',
						...stampCreate(actorId),
					},
					tx,
				)
				if (!invoiceRef) throw SalesInvoiceError.generateFailed()

				const orderItems = await this.salesOrder.findItemsByOrderId(data.orderId, tx)
				if (orderItems.length > 0) {
					const items = orderItems.map((item) => ({
						invoiceId: invoiceRef.id,
						salesOrderItemId: item.id,
						productId: item.productId,
						variantId: item.variantId,
						itemName: item.itemName,
						quantity: item.quantity,
						unitPrice: item.unitPrice,
						taxAmount: item.taxAmount,
						discountAmount: item.discountAmount,
						subtotal: item.subtotal,
						...stampCreate(actorId),
					}))
					await this.repo.insertItems(items, tx)
				}

				return invoiceRef
			})

			await this.invalidate()
			return result
		})
	}

	async handleUpdate(data: SalesInvoiceUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('SalesInvoiceService.handleUpdate', async () => {
			const { id } = data
			const existing = await this.getById(id)
			if (!existing) throw SalesInvoiceError.notFound(id)

			if (existing.status === 'paid' || existing.status === 'void') {
				throw SalesInvoiceError.updateFailed()
			}

			const result = await this.repo.update(
				id,
				{
					...data,
					status: data.status ?? existing.status,
					dueDate: data.dueDate ?? existing.dueDate,
					notes: data.notes ?? existing.notes,
					...stampUpdate(actorId),
				},
				this.repo.db,
			)
			if (!result) throw SalesInvoiceError.notFound(id)

			await this.invalidate(id)
			return result
		})
	}

	async handleRemove(id: number): Promise<EntityRef> {
		return record('SalesInvoiceService.handleRemove', async () => {
			const existing = await this.getById(id)
			if (!existing) throw SalesInvoiceError.notFound(id)

			if (existing.status === 'paid' || existing.status === 'open') {
				throw SalesInvoiceError.updateFailed()
			}

			const result = await this.repo.remove(id, this.repo.db)
			if (!result) throw SalesInvoiceError.notFound(id)

			await this.invalidate(id)
			return result
		})
	}
}

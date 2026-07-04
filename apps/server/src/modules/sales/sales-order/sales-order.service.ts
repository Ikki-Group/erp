import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'
import { withTransaction } from '@/infra/database'
import { stampCreate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	SalesOrderAddBatchDto,
	SalesOrderCreateDto,
	SalesOrderDto,
	SalesOrderFilterDto,
	SalesOrderOutputDto,
	SalesOrderVoidDto,
} from './sales-order.contract'
import { SalesOrderError } from './sales-order.internal'
import type { ISalesOrderRepo } from './sales-order.repo'

export interface LocationReadPort {
	getById(id: number): Promise<{ id: number; name: string } | undefined>
}

export interface CustomerReadPort {
	getById(id: number): Promise<{ id: number; name: string } | undefined>
}

export interface SalesTypeReadPort {
	getById(id: number): Promise<{ id: number; name: string } | undefined>
}

export interface ProductReadPort {
	getById(id: number): Promise<{ id: number; name: string } | undefined>
}

interface SalesOrderServiceDeps {
	location: LocationReadPort
	customer: CustomerReadPort
	salesType: SalesTypeReadPort
	product: ProductReadPort
}

export class SalesOrderService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ISalesOrderRepo,
		cacheClient: CacheClient,
		private readonly deps: SalesOrderServiceDeps,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'sales.order')
	}

	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		await this.cache.deleteFromKeys(keys)
	}

	private async validateRelatedEntities(data: SalesOrderCreateDto): Promise<void> {
		const location = await this.deps.location.getById(data.locationId)
		if (!location) throw SalesOrderError.notFound(data.locationId)

		const salesType = await this.deps.salesType.getById(data.salesTypeId)
		if (!salesType) throw SalesOrderError.notFound(data.salesTypeId)

		if (data.customerId) {
			const customer = await this.deps.customer.getById(data.customerId)
			if (!customer) throw SalesOrderError.notFound(data.customerId)
		}

		if (data.items) {
			for (const item of data.items) {
				if (item.productId) {
					const product = await this.deps.product.getById(item.productId)
					if (!product) throw SalesOrderError.notFound(item.productId)
				}
			}
		}
	}

	async create(data: SalesOrderCreateDto, actorId: ActorId): Promise<EntityRef> {
		const result = await withTransaction(this.repo.db, async (tx) => {
			const metadata = stampCreate(actorId)

			const order = await this.repo.insert(
				{
					locationId: data.locationId,
					customerId: data.customerId ?? null,
					salesTypeId: data.salesTypeId,
					status: data.status ?? 'open',
					transactionDate: data.transactionDate ?? new Date(),
					totalAmount: data.totalAmount.toString(),
					discountAmount: data.discountAmount.toString(),
					taxAmount: data.taxAmount.toString(),
					gratuityAmount: data.gratuityAmount?.toString() ?? '0',
					refundAmount: data.refundAmount?.toString() ?? '0',
					...metadata,
				},
				tx,
			)
			if (!order) throw SalesOrderError.createFailed()

			if (data.items && data.items.length > 0) {
				await this.repo.insertItems(
					data.items.map((item) => ({
						orderId: order.id,
						batchId: item.batchId ?? null,
						productId: item.productId ?? null,
						variantId: item.variantId ?? null,
						itemName: item.itemName,
						quantity: item.quantity.toString(),
						unitPrice: item.unitPrice.toString(),
						discountAmount: item.discountAmount.toString(),
						taxAmount: item.taxAmount.toString(),
						subtotal: item.subtotal.toString(),
						...metadata,
					})),
					tx,
				)
			}

			return order
		})

		await this.invalidate()
		return result
	}

	async createWithExternalRef(
		data: SalesOrderCreateDto,
		externalRef: { source: string; extId: string; payload: unknown },
		actorId: ActorId,
	): Promise<EntityRef> {
		const result = await withTransaction(this.repo.db, async (tx) => {
			const metadata = stampCreate(actorId)

			const order = await this.repo.insert(
				{
					locationId: data.locationId,
					customerId: data.customerId ?? null,
					salesTypeId: data.salesTypeId,
					status: data.status ?? 'open',
					transactionDate: data.transactionDate ?? new Date(),
					totalAmount: data.totalAmount.toString(),
					discountAmount: data.discountAmount.toString(),
					taxAmount: data.taxAmount.toString(),
					gratuityAmount: data.gratuityAmount?.toString() ?? '0',
					refundAmount: data.refundAmount?.toString() ?? '0',
					...metadata,
				},
				tx,
			)
			if (!order) throw SalesOrderError.createFailed()

			if (data.items && data.items.length > 0) {
				await this.repo.insertItems(
					data.items.map((item) => ({
						orderId: order.id,
						batchId: item.batchId ?? null,
						productId: item.productId ?? null,
						variantId: item.variantId ?? null,
						itemName: item.itemName,
						quantity: item.quantity.toString(),
						unitPrice: item.unitPrice.toString(),
						discountAmount: item.discountAmount.toString(),
						taxAmount: item.taxAmount.toString(),
						subtotal: item.subtotal.toString(),
						...metadata,
					})),
					tx,
				)
			}

			await this.repo.insertExternalRef(
				{
					orderId: order.id,
					externalSource: externalRef.source,
					externalOrderId: externalRef.extId,
					rawPayload: externalRef.payload ?? null,
					...metadata,
				},
				tx,
			)

			return order
		})

		await this.invalidate()
		return result
	}

	async addBatch(orderId: number, data: SalesOrderAddBatchDto, actorId: ActorId): Promise<EntityRef> {
		const existing = await this.repo.findById(orderId)
		if (!existing) throw SalesOrderError.notFound(orderId)
		if (existing.status !== 'open') throw SalesOrderError.notOpen(orderId)

		const result = await withTransaction(this.repo.db, async (tx) => {
			const metadata = stampCreate(actorId)

			const batch = await this.repo.insertBatch(
				{
					orderId,
					batchNumber: data.batchNumber.toString(),
					status: 'pending',
					...metadata,
				},
				tx,
			)
			if (!batch) throw SalesOrderError.batchCreateFailed()

			if (data.items.length > 0) {
				await this.repo.insertItems(
					data.items.map((item) => ({
						orderId,
						batchId: batch.id,
						productId: item.productId ?? null,
						variantId: item.variantId ?? null,
						itemName: item.itemName,
						quantity: item.quantity.toString(),
						unitPrice: item.unitPrice.toString(),
						discountAmount: item.discountAmount.toString(),
						taxAmount: item.taxAmount.toString(),
						subtotal: item.subtotal.toString(),
						...metadata,
					})),
					tx,
				)
			}

			await this.repo.recalculateTotals(orderId, actorId, tx)
			return batch
		})

		await this.invalidate(orderId)
		return result
	}

	async close(orderId: number, actorId: ActorId): Promise<EntityRef> {
		const existing = await this.repo.findById(orderId)
		if (!existing) throw SalesOrderError.notFound(orderId)
		if (existing.status !== 'open') throw SalesOrderError.notOpen(orderId)

		const result = await this.repo.updateOrderStatus(orderId, 'closed', actorId)
		if (!result) throw SalesOrderError.notFound(orderId)

		await this.invalidate(orderId)
		return result
	}

	async void(orderId: number, data: SalesOrderVoidDto, actorId: ActorId): Promise<EntityRef> {
		const existing = await this.repo.findById(orderId)
		if (!existing) throw SalesOrderError.notFound(orderId)

		if (data.itemId) {
			const item = existing.items?.find((i) => i.id === data.itemId)
			if (!item) throw SalesOrderError.itemNotFound(data.itemId)
		}

		await withTransaction(this.repo.db, async (tx) => {
			const metadata = stampCreate(actorId)

			await this.repo.insertVoid(
				{
					orderId,
					itemId: data.itemId ?? null,
					reason: data.reason,
					voidedBy: actorId,
					...metadata,
				},
				tx,
			)

			if (!data.itemId) {
				await this.repo.updateOrderStatus(orderId, 'void', actorId, tx)
			} else if (existing.status === 'open') {
				await this.repo.recalculateTotals(orderId, actorId, tx)
			}
		})

		await this.invalidate(orderId)
		return { id: orderId }
	}

	async handleList(filter: SalesOrderFilterDto): Promise<WithPaginationResult<SalesOrderDto>> {
		return record('SalesOrderService.handleList', async () => this.repo.findPage(filter))
	}

	async handleDetail(id: number): Promise<SalesOrderOutputDto> {
		return record('SalesOrderService.handleDetail', async () => {
			const order = await this.repo.findById(id)
			if (!order) throw SalesOrderError.notFound(id)
			return order
		})
	}

	async handleCreate(data: SalesOrderCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('SalesOrderService.handleCreate', async () => {
			await this.validateRelatedEntities(data)
			return this.create(data, actorId)
		})
	}

	async handleAddBatch(orderId: number, data: SalesOrderAddBatchDto, actorId: ActorId): Promise<EntityRef> {
		return record('SalesOrderService.handleAddBatch', async () => this.addBatch(orderId, data, actorId))
	}

	async handleClose(orderId: number, actorId: ActorId): Promise<EntityRef> {
		return record('SalesOrderService.handleClose', async () => this.close(orderId, actorId))
	}

	async handleVoid(orderId: number, data: SalesOrderVoidDto, actorId: ActorId): Promise<EntityRef> {
		return record('SalesOrderService.handleVoid', async () => this.void(orderId, data, actorId))
	}

	async handleExternalIngestion(
		data: SalesOrderCreateDto,
		externalRef: { source: string; extId: string; payload: unknown },
		actorId: ActorId,
	): Promise<EntityRef> {
		return record('SalesOrderService.handleExternalIngestion', async () => {
			const existingId = await this.repo.findExternalRef(externalRef.source, externalRef.extId)
			if (existingId) return { id: existingId }

			await this.validateRelatedEntities(data)
			return this.createWithExternalRef(data, externalRef, actorId)
		})
	}
}

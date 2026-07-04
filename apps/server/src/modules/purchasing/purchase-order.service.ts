import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'
import { withTransaction } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	PurchaseOrderApproveDto,
	PurchaseOrderCreateDto,
	PurchaseOrderDto,
	PurchaseOrderFilterDto,
	PurchaseOrderRejectDto,
	PurchaseOrderSelectDto,
	PurchaseOrderSubmitForApprovalDto,
	PurchaseOrderUpdateDto,
} from './purchase-order.contract'
import { PurchaseOrderError } from './purchase-order.internal'
import type { IPurchaseOrderRepo } from './purchase-order.repo'

export interface SupplierReadPort {
	getById(id: number): Promise<{ id: number; name: string } | undefined>
}

export interface LocationReadPort {
	getById(id: number): Promise<{ id: number; name: string } | undefined>
}

export interface MaterialReadPort {
	getById(id: number): Promise<{ id: number; name: string } | undefined>
}

export interface PurchaseOrderDeps {
	supplier: SupplierReadPort
	location: LocationReadPort
	material: MaterialReadPort
}

export class PurchaseOrderService {
	private readonly cache: CacheService

	constructor(
		private readonly deps: PurchaseOrderDeps,
		private readonly repo: IPurchaseOrderRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'purchasing.order')
	}

	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		await this.cache.deleteFromKeys(keys)
	}

	private async getById(id: number): Promise<PurchaseOrderDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	private async validateRefs(data: { supplierId: number; locationId: number }): Promise<void> {
		const [supplier, location] = await Promise.all([
			this.deps.supplier.getById(data.supplierId),
			this.deps.location.getById(data.locationId),
		])
		if (!supplier) throw PurchaseOrderError.notFound(data.supplierId)
		if (!location) throw PurchaseOrderError.notFound(data.locationId)
	}

	private async validateItems(items: PurchaseOrderCreateDto['items']): Promise<void> {
		const materialIds = items
			.map((i) => i.materialId)
			.filter((id): id is number => id !== null && id !== undefined)
		if (materialIds.length === 0) return

		const uniqueIds = [...new Set(materialIds)]
		for (const id of uniqueIds) {
			const material = await this.deps.material.getById(id)
			if (!material) throw PurchaseOrderError.notFound(id)
		}
	}

	async handleList(filter: PurchaseOrderFilterDto): Promise<WithPaginationResult<PurchaseOrderSelectDto>> {
		return record('PurchaseOrderService.handleList', async () => this.repo.findPage(filter))
	}

	async handleGetById(id: number): Promise<PurchaseOrderDto> {
		return record('PurchaseOrderService.handleGetById', async () => {
			const result = await this.getById(id)
			if (!result) throw PurchaseOrderError.notFound(id)
			return result
		})
	}

	async handleCreate(data: PurchaseOrderCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('PurchaseOrderService.handleCreate', async () => {
			await this.validateRefs(data)
			await this.validateItems(data.items)

			const orderData = {
				locationId: data.locationId,
				supplierId: data.supplierId,
				status: data.status,
				transactionDate: data.transactionDate,
				expectedDeliveryDate: data.expectedDeliveryDate,
				totalAmount: data.totalAmount,
				discountAmount: data.discountAmount,
				taxAmount: data.taxAmount,
				notes: data.notes,
				...stampCreate(actorId),
			}

			const itemsData = data.items.map((item) => ({
				materialId: item.materialId,
				itemName: item.itemName,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				discountAmount: item.discountAmount,
				taxAmount: item.taxAmount,
				subtotal: item.subtotal,
				orderId: 0 as number,
				...stampCreate(actorId),
			}))

			const result = await this.repo.insert(orderData, itemsData)
			if (!result) throw PurchaseOrderError.createFailed()

			await this.invalidate()
			return result
		})
	}

	async handleUpdate(data: PurchaseOrderUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('PurchaseOrderService.handleUpdate', async () => {
			const { id, items, ...orderData } = data

			const existing = await this.getById(id)
			if (!existing) throw PurchaseOrderError.notFound(id)

			await this.validateRefs(orderData)
			await this.validateItems(items)

			const updateData = {
				...orderData,
				...stampUpdate(actorId),
			}

			const itemsData = items.map((item) => ({
				materialId: item.materialId,
				itemName: item.itemName,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				discountAmount: item.discountAmount,
				taxAmount: item.taxAmount,
				subtotal: item.subtotal,
				orderId: id,
				...stampCreate(actorId),
			}))

			const result = await withTransaction(this.repo.db, async (tx) => {
				return this.repo.update(id, updateData, itemsData, tx)
			})

			if (!result) throw PurchaseOrderError.updateFailed()

			await this.invalidate(id)
			return result
		})
	}

	async handleRemove(id: number): Promise<EntityRef> {
		return record('PurchaseOrderService.handleRemove', async () => {
			const existing = await this.getById(id)
			if (!existing) throw PurchaseOrderError.notFound(id)

			const result = await this.repo.remove(id)
			if (!result) throw PurchaseOrderError.notFound(id)

			await this.invalidate(id)
			return result
		})
	}

	async handleSubmitForApproval(data: PurchaseOrderSubmitForApprovalDto): Promise<EntityRef> {
		return record('PurchaseOrderService.handleSubmitForApproval', async () => {
			const { id } = data
			const order = await this.getById(id)
			if (!order) throw PurchaseOrderError.notFound(id)

			if (order.status !== 'open') {
				throw PurchaseOrderError.invalidStatus(order.status)
			}

			const result = await this.repo.updateStatus(id, 'pending_approval')
			if (!result) throw PurchaseOrderError.updateFailed()

			await this.invalidate(id)
			return result
		})
	}

	async handleApprove(data: PurchaseOrderApproveDto): Promise<EntityRef> {
		return record('PurchaseOrderService.handleApprove', async () => {
			const { id } = data
			const order = await this.getById(id)
			if (!order) throw PurchaseOrderError.notFound(id)

			if (order.status !== 'pending_approval') {
				throw PurchaseOrderError.invalidStatus(order.status)
			}

			const result = await this.repo.updateStatus(id, 'approved')
			if (!result) throw PurchaseOrderError.updateFailed()

			await this.invalidate(id)
			return result
		})
	}

	async handleReject(data: PurchaseOrderRejectDto): Promise<EntityRef> {
		return record('PurchaseOrderService.handleReject', async () => {
			const { id } = data
			const order = await this.getById(id)
			if (!order) throw PurchaseOrderError.notFound(id)

			if (order.status !== 'pending_approval') {
				throw PurchaseOrderError.invalidStatus(order.status)
			}

			const result = await this.repo.updateStatus(id, 'rejected')
			if (!result) throw PurchaseOrderError.updateFailed()

			await this.invalidate(id)
			return result
		})
	}
}

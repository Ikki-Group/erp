import { record } from '@elysiajs/opentelemetry'
import { and, inArray } from 'drizzle-orm'

import { purchaseOrderItemsTable } from '@/db/schema'
import { CacheService, type CacheClient } from '@/infra/cache'
import type { DbTx } from '@/infra/database'
import { withTransaction } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	GoodsReceiptNoteCreateDto,
	GoodsReceiptNoteDto,
	GoodsReceiptNoteFilterDto,
	GoodsReceiptNoteSelectDto,
} from './goods-receipt.contract'
import { GoodsReceiptError } from './goods-receipt.internal'
import type { IGoodsReceiptRepo } from './goods-receipt.repo'

export interface StockTransactionPort {
	purchase(
		data: {
			locationId: number
			date: Date
			referenceNo: string
			notes: string | null
			items: Array<{ materialId: number; qty: string; unitCost: string }>
		},
		actorId: number,
		tx: DbTx,
	): Promise<{ count: number; referenceNo: string }>
}

export interface PurchaseOrderReadPort {
	handleGetById(id: number): Promise<{ id: number; status: string }>
}

export interface GoodsReceiptDeps {
	stockTransaction: StockTransactionPort
	purchaseOrder: PurchaseOrderReadPort
}

export class GoodsReceiptService {
	private readonly cache: CacheService

	constructor(
		private readonly deps: GoodsReceiptDeps,
		private readonly repo: IGoodsReceiptRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'purchasing.receipt')
	}

	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		await this.cache.deleteFromKeys(keys)
	}

	private async getById(id: number): Promise<GoodsReceiptNoteDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	async handleList(filter: GoodsReceiptNoteFilterDto): Promise<WithPaginationResult<GoodsReceiptNoteSelectDto>> {
		return record('GoodsReceiptService.handleList', async () =>
			this.cache.getOrSet({
				key: `${this.cache.keys.list}.${JSON.stringify(filter)}`,
				factory: () => this.repo.findPage(filter),
			}),
		)
	}

	async handleDetail(id: number): Promise<GoodsReceiptNoteDto> {
		return record('GoodsReceiptService.handleDetail', async () => {
			const result = await this.getById(id)
			if (!result) throw GoodsReceiptError.notFound(id)
			return result
		})
	}

	async handleCreate(data: GoodsReceiptNoteCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('GoodsReceiptService.handleCreate', async () => {
			const result = await this.repo.insert(data, actorId)
			if (!result) throw GoodsReceiptError.createFailed()

			await this.invalidate()
			return result
		})
	}

	async handleComplete(id: number, actorId: ActorId): Promise<EntityRef> {
		return record('GoodsReceiptService.handleComplete', async () => {
			const grn = await this.getById(id)
			if (!grn) throw GoodsReceiptError.notFound(id)
			if (grn.status !== 'open') throw GoodsReceiptError.alreadyCompleted(grn.status)

			const poItemIds = grn.items.map((i) => i.purchaseOrderItemId).filter(Boolean)
			const result = await withTransaction(this.repo.db, async (tx) => {
				const poItems = await tx
					.select({ id: purchaseOrderItemsTable.id, unitPrice: purchaseOrderItemsTable.unitPrice })
					.from(purchaseOrderItemsTable)
					.where(and(inArray(purchaseOrderItemsTable.id, poItemIds)))

				const poItemMap = new Map(poItems.map((i) => [i.id, i.unitPrice]))

				await this.deps.stockTransaction.purchase(
					{
						locationId: grn.locationId,
						date: grn.receiveDate,
						referenceNo: `GRN-${grn.id}`,
						notes: grn.notes ?? null,
						items: grn.items.map((item) => {
							const unitCost = item.purchaseOrderItemId
								? String(poItemMap.get(item.purchaseOrderItemId) ?? '0')
								: '0'
							return { materialId: item.materialId!, qty: String(item.quantityReceived), unitCost }
						}),
					},
					actorId,
					tx,
				)

				const updated = await this.repo.updateStatus(id, 'completed', actorId, tx)
				if (!updated) throw GoodsReceiptError.updateFailed()
				return updated
			})

			await this.invalidate(id)
			return result
		})
	}

	async handleRemove(id: number, actorId: ActorId): Promise<EntityRef> {
		return record('GoodsReceiptService.handleRemove', async () => {
			const existing = await this.getById(id)
			if (!existing) throw GoodsReceiptError.notFound(id)

			const result = await this.repo.softDelete(id, actorId)
			if (!result) throw GoodsReceiptError.notFound(id)

			await this.invalidate(id)
			return result
		})
	}

	async handleHardRemove(id: number): Promise<EntityRef> {
		return record('GoodsReceiptService.handleHardRemove', async () => {
			const result = await this.repo.hardDelete(id)
			if (!result) throw GoodsReceiptError.notFound(id)

			await this.invalidate(id)
			return result
		})
	}
}

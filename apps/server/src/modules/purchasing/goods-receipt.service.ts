import { and, inArray } from 'drizzle-orm'

import { CacheService, type CacheClient } from '@/infra/cache'

import { purchaseOrderItemsTable } from '@/db/schema'

import type { DbClient } from '@/infra/database'
import { ConflictError, NotFoundError } from '@/shared/errors/http-error'

import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type { StockTransactionService } from '@/modules/inventory'

import { GoodsReceiptRepo } from './goods-receipt.repo'
import type {
	GoodsReceiptNoteDto,
	GoodsReceiptNoteFilterDto,
	GoodsReceiptNoteSelectDto,
	GoodsReceiptNoteCreateDto,
} from './goods-receipt.contract'

export class GoodsReceiptService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: GoodsReceiptRepo,
		private readonly inventorySvc: StockTransactionService,
		private readonly db: DbClient,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'purchasing.receipt')
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<GoodsReceiptNoteDto> {
		const key = `byId:${id}`
		const grn = await this.cache.getOrSetWithSkip({
			key,
			factory: () => this.repo.getById(id),
		})
		if (!grn) throw new NotFoundError(`GRN with ID ${id} not found`, { code: 'GRN_NOT_FOUND' })
		return grn
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: GoodsReceiptNoteFilterDto,
	): Promise<WithPaginationResult<GoodsReceiptNoteSelectDto>> {
		const key = `list.${JSON.stringify(filter)}`
		return this.cache.getOrSet({
			key,
			factory: () => this.repo.getListPaginated(filter),
		})
	}

	async handleDetail(id: number): Promise<GoodsReceiptNoteDto> {
		return this.getById(id)
	}

	async handleCreate(data: GoodsReceiptNoteCreateDto, actorId: ActorId): Promise<EntityRef> {
		const result = await this.repo.create(data, actorId)
		await this.cache.deleteMany({ keys: ['list', 'count'] })
		return result
	}

	async handleComplete(id: number, actorId: ActorId): Promise<EntityRef> {
		return this.db.transaction(async (tx) => {
			const grn = await this.getById(id)
			if (grn.status !== 'open') {
				throw new ConflictError(`GRN is already ${grn.status}`, { code: 'GRN_STATUS_CONFLICT' })
			}

			const poItemIds = grn.items.map((i) => i.purchaseOrderItemId).filter(Boolean)
			const poItems = await tx
				.select({ id: purchaseOrderItemsTable.id, unitPrice: purchaseOrderItemsTable.unitPrice })
				.from(purchaseOrderItemsTable)
				.where(and(inArray(purchaseOrderItemsTable.id, poItemIds)))

			const poItemMap = new Map(poItems.map((i) => [i.id, i.unitPrice]))

			await this.inventorySvc.handlePurchase(
				{
					locationId: grn.locationId,
					date: grn.receiveDate,
					referenceNo: `GRN-${grn.id}`,
					notes: grn.notes ?? null,
					items: grn.items.map((item) => {
						const unitCost = item.purchaseOrderItemId
							? String(poItemMap.get(item.purchaseOrderItemId) ?? '0')
							: '0'
						return { materialId: item.materialId!, qty: item.quantityReceived, unitCost }
					}),
				},
				actorId,
				tx,
			)

			const result = await this.repo.updateStatus(id, 'completed', actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
			return result
		})
	}

	async handleRemove(id: number, actorId: ActorId): Promise<EntityRef> {
		const result = await this.repo.softDelete(id, actorId)
		await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
		return result
	}

	async handleHardRemove(id: number): Promise<EntityRef> {
		const result = await this.repo.hardDelete(id)
		await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
		return result
	}
}

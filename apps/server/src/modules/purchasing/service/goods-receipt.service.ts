import { record } from '@elysiajs/opentelemetry'
import { and, inArray } from 'drizzle-orm'

import { ConflictError, NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import { db } from '@/db'
import { purchaseOrderItemsTable } from '@/db/schema'

import type { StockTransactionService } from '@/modules/inventory'

import type * as dto from '../dto/goods-receipt.dto'
import { GoodsReceiptRepo } from '../repo/goods-receipt.repo'

export class GoodsReceiptService {
	constructor(
		private readonly inventorySvc: StockTransactionService,
		private readonly repo = new GoodsReceiptRepo(),
	) {}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<dto.GoodsReceiptNoteDto> {
		return record('GoodsReceiptService.getById', async () => {
			const grn = await this.repo.getById(id)
			if (!grn) throw new NotFoundError(`GRN with ID ${id} not found`, 'GRN_NOT_FOUND')
			return grn
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: dto.GoodsReceiptNoteFilterDto,
	): Promise<WithPaginationResult<dto.GoodsReceiptNoteSelectDto>> {
		return record('GoodsReceiptService.handleList', async () => {
			return this.repo.getListPaginated(filter)
		})
	}

	async handleDetail(id: number): Promise<dto.GoodsReceiptNoteDto> {
		return record('GoodsReceiptService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	async handleCreate(
		data: dto.GoodsReceiptNoteCreateDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('GoodsReceiptService.handleCreate', async () => {
			return this.repo.create(data, actorId)
		})
	}

	async handleComplete(id: number, actorId: number): Promise<{ id: number }> {
		return record('GoodsReceiptService.handleComplete', async () => {
			return db.transaction(async (tx) => {
				const grn = await this.getById(id)
				if (grn.status !== 'open') {
					throw new ConflictError(`GRN is already ${grn.status}`, 'GRN_STATUS_CONFLICT')
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

				return this.repo.updateStatus(id, 'completed', actorId)
			})
		})
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('GoodsReceiptService.handleRemove', async () => {
			return this.repo.softDelete(id, actorId)
		})
	}

	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('GoodsReceiptService.handleHardRemove', async () => {
			return this.repo.hardDelete(id)
		})
	}
}

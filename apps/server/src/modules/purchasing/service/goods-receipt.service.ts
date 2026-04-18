import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, inArray, isNull, or } from 'drizzle-orm'

import * as core from '@/core/database'
import { ConflictError } from '@/core/http/errors'

import { db } from '@/db'
import {
	goodsReceiptNoteItemsTable,
	goodsReceiptNotesTable,
	purchaseOrderItemsTable,
} from '@/db/schema'

import type { StockTransactionService } from '@/modules/inventory/service/stock-transaction.service'

import * as dto from '../dto/goods-receipt.dto'

// Goods Receipt Service (Layer 2)
// Handles material intake against POs.
export class GoodsReceiptService {
	constructor(private readonly inventorySvc: StockTransactionService) {}

	async getById(id: number): Promise<dto.GoodsReceiptNoteDto> {
		const result = await record('GoodsReceiptService.getById', async () => {
			const rows = await db
				.select()
				.from(goodsReceiptNotesTable)
				.where(and(eq(goodsReceiptNotesTable.id, id), isNull(goodsReceiptNotesTable.deletedAt)))
			const first = core.takeFirstOrThrow(rows, `GRN with ID ${id} not found`, 'GRN_NOT_FOUND')

			const items = await db
				.select()
				.from(goodsReceiptNoteItemsTable)
				.where(
					and(
						eq(goodsReceiptNoteItemsTable.grnId, first.id),
						isNull(goodsReceiptNoteItemsTable.deletedAt),
					),
				)

			return dto.GoodsReceiptNoteDto.parse({ ...first, items })
		})
		return result
	}

	async handleList(
		filter: dto.GoodsReceiptNoteFilterDto,
	): Promise<core.WithPaginationResult<dto.GoodsReceiptNoteSelectDto>> {
		const result = await record('GoodsReceiptService.handleList', async () => {
			const { q, page, limit, status, orderId, locationId, supplierId } = filter
			const where = and(
				isNull(goodsReceiptNotesTable.deletedAt),
				q === undefined
					? undefined
					: or(
							core.searchFilter(goodsReceiptNotesTable.referenceNumber, q),
							core.searchFilter(goodsReceiptNotesTable.notes, q),
						),
				status === undefined ? undefined : eq(goodsReceiptNotesTable.status, status),
				orderId === undefined ? undefined : eq(goodsReceiptNotesTable.orderId, orderId),
				locationId === undefined ? undefined : eq(goodsReceiptNotesTable.locationId, locationId),
				supplierId === undefined ? undefined : eq(goodsReceiptNotesTable.supplierId, supplierId),
			)

			const p = await core.paginate<dto.GoodsReceiptNoteSelectDto>({
				data: async ({ limit: l, offset }) => {
					const rows = await db
						.select()
						.from(goodsReceiptNotesTable)
						.where(where)
						.orderBy(core.sortBy(goodsReceiptNotesTable.updatedAt, 'desc'))
						.limit(l)
						.offset(offset)
					return rows.map((r) => dto.GoodsReceiptNoteSelectDto.parse(r))
				},
				pq: { page, limit },
				countQuery: db.select({ count: count() }).from(goodsReceiptNotesTable).where(where),
			})
			return p
		})
		return result
	}

	async handleDetail(id: number): Promise<dto.GoodsReceiptNoteDto> {
		const result = await record('GoodsReceiptService.handleDetail', async () => {
			return this.getById(id)
		})
		return result
	}

	async handleCreate(
		data: dto.GoodsReceiptNoteCreateDto,
		actorId: number,
	): Promise<{ id: number }> {
		const result = await record('GoodsReceiptService.handleCreate', async () => {
			return db.transaction(async (tx) => {
				const { items, ...headerData } = data

				const [insertedGrn] = await tx
					.insert(goodsReceiptNotesTable)
					.values({ ...headerData, ...core.stampCreate(actorId) })
					.returning({ id: goodsReceiptNotesTable.id })

				if (!insertedGrn) throw new Error('Create GRN header failed')

				const itemValues = items.map((item) => {
					const stamp = core.stampCreate(actorId)
					return {
						grnId: insertedGrn.id,
						purchaseOrderItemId: item.purchaseOrderItemId,
						materialId: item.materialId,
						itemName: item.itemName,
						quantityReceived: item.quantityReceived?.toString(),
						notes: item.notes,
						createdBy: stamp.createdBy,
						updatedBy: stamp.updatedBy,
						createdAt: stamp.createdAt,
						updatedAt: stamp.updatedAt,
					}
				})

				if (itemValues.length > 0) {
					await tx.insert(goodsReceiptNoteItemsTable).values(itemValues)
				}

				return insertedGrn
			})
		})
		return result
	}

	async handleComplete(id: number, actorId: number): Promise<{ id: number }> {
		return record('GoodsReceiptService.handleComplete', async () => {
			return db.transaction(async (tx) => {
				// 1. Get GRN detail and check status
				const grn = await this.getById(id)
				if (grn.status !== 'open') {
					throw new ConflictError(`GRN is already ${grn.status}`, 'GRN_STATUS_CONFLICT')
				}

				// 2. Fetch PO items for costs
				const poItemIds = grn.items.map((i) => i.purchaseOrderItemId).filter(Boolean)
				const poItems = await tx
					.select({ id: purchaseOrderItemsTable.id, unitPrice: purchaseOrderItemsTable.unitPrice })
					.from(purchaseOrderItemsTable)
					.where(and(inArray(purchaseOrderItemsTable.id, poItemIds)))

				const poItemMap = new Map(poItems.map((i) => [i.id, Number(i.unitPrice)]))

				// 3. Trigger Stock In - pass the transaction 'tx'
				await this.inventorySvc.handlePurchase(
					{
						locationId: grn.locationId,
						date: grn.receiveDate,
						referenceNo: `GRN-${grn.id}`,
						notes: grn.notes || null,
						items: grn.items.map((item) => {
							const unitCost = item.purchaseOrderItemId
								? (poItemMap.get(item.purchaseOrderItemId) ?? 0)
								: 0
							return { materialId: item.materialId!, qty: Number(item.quantityReceived), unitCost }
						}),
					},
					actorId,
					tx,
				)

				// 4. Update GRN status
				await tx
					.update(goodsReceiptNotesTable)
					.set({ status: 'completed', ...core.stampUpdate(actorId) })
					.where(eq(goodsReceiptNotesTable.id, id))

				return { id }
			})
		})
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('GoodsReceiptService.handleRemove', async () => {
			const [result] = await db
				.update(goodsReceiptNotesTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(goodsReceiptNotesTable.id, id))
				.returning({ id: goodsReceiptNotesTable.id })
			if (!result) throw new Error('GRN not found')
			return result
		})
	}

	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('GoodsReceiptService.handleHardRemove', async () => {
			const [result] = await db
				.delete(goodsReceiptNotesTable)
				.where(eq(goodsReceiptNotesTable.id, id))
				.returning({ id: goodsReceiptNotesTable.id })
			if (!result) throw new Error('GRN not found')
			return result
		})
	}
}

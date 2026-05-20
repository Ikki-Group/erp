import { and, count, eq, isNull, or } from 'drizzle-orm'

import { goodsReceiptNoteItemsTable, goodsReceiptNotesTable } from '@/db/schema'

import {
	paginate,
	searchFilter,
	sortBy, type DbClient} from '@/infra/database'
import type { WithPaginationResult } from '@/types/pagination'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'

import type { ActorId, EntityRef } from '@/types/utils'

import {
	GoodsReceiptNoteCreateSchema,
	GoodsReceiptNoteSchema,
	GoodsReceiptNoteFilterSchema,
	GoodsReceiptNoteSelectSchema, type GoodsReceiptStatus,
} from './goods-receipt.schema'

export class GoodsReceiptRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<GoodsReceiptNoteSchema | undefined> {
		const [grn] = await this.db
			.select()
			.from(goodsReceiptNotesTable)
			.where(and(eq(goodsReceiptNotesTable.id, id), isNull(goodsReceiptNotesTable.deletedAt)))

		if (!grn) return undefined

		const items = await this.db
			.select()
			.from(goodsReceiptNoteItemsTable)
			.where(
				and(eq(goodsReceiptNoteItemsTable.grnId, id), isNull(goodsReceiptNoteItemsTable.deletedAt)),
			)

		return GoodsReceiptNoteSchema.parse({ ...grn, items })
	}

	async getListPaginated(
		filter: GoodsReceiptNoteFilterSchema,
	): Promise<WithPaginationResult<GoodsReceiptNoteSelectSchema>> {
		const { q, page, limit, status, orderId, locationId, supplierId } = filter
		const where = and(
			isNull(goodsReceiptNotesTable.deletedAt),
			q === undefined
				? undefined
				: or(
						searchFilter(goodsReceiptNotesTable.referenceNumber, q),
						searchFilter(goodsReceiptNotesTable.notes, q),
					),
			status === undefined ? undefined : eq(goodsReceiptNotesTable.status, status),
			orderId === undefined ? undefined : eq(goodsReceiptNotesTable.orderId, orderId),
			locationId === undefined ? undefined : eq(goodsReceiptNotesTable.locationId, locationId),
			supplierId === undefined ? undefined : eq(goodsReceiptNotesTable.supplierId, supplierId),
		)

		return paginate<any>({
			data: async ({ limit: l, offset }) => {
				const rows = await this.db
					.select()
					.from(goodsReceiptNotesTable)
					.where(where)
					.orderBy(sortBy(goodsReceiptNotesTable.updatedAt, 'desc'))
					.limit(l)
					.offset(offset)
				return rows.map((r) => GoodsReceiptNoteSelectSchema.parse(r))
			},
			pq: { page, limit },
			countQuery: () => this.db.select({ count: count() }).from(goodsReceiptNotesTable).where(where),
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: GoodsReceiptNoteCreateSchema, actorId: ActorId): Promise<EntityRef> {
		const result = await this.db.transaction(async (tx) => {
			const { items, ...headerData } = data
			const meta = stampCreate(actorId)

			const [insertedGrn] = await tx
				.insert(goodsReceiptNotesTable)
				.values({ ...headerData, ...meta })
				.returning({ id: goodsReceiptNotesTable.id })

			if (!insertedGrn) throw new Error('Create GRN header failed')

			const itemValues = items.map((item) => ({
				grnId: insertedGrn.id,
				purchaseOrderItemId: item.purchaseOrderItemId,
				materialId: item.materialId,
				itemName: item.itemName,
				quantityReceived: item.quantityReceived?.toString(),
				notes: item.notes,
				...meta,
			}))

			if (itemValues.length > 0) {
				await tx.insert(goodsReceiptNoteItemsTable).values(itemValues)
			}

			return { id: insertedGrn.id }
		})
		return result
	}

	async updateStatus(id: number, status: GoodsReceiptStatus, actorId: ActorId): Promise<EntityRef> {
		await this.db
			.update(goodsReceiptNotesTable)
			.set({ status, ...stampUpdate(actorId) })
			.where(eq(goodsReceiptNotesTable.id, id))
		return { id }
	}

	async softDelete(id: number, actorId: ActorId): Promise<EntityRef> {
		const [result] = await this.db
			.update(goodsReceiptNotesTable)
			.set({ deletedAt: new Date(), deletedBy: actorId })
			.where(eq(goodsReceiptNotesTable.id, id))
			.returning({ id: goodsReceiptNotesTable.id })
		if (!result) throw new Error('GRN not found')
		return { id: result.id }
	}

	async hardDelete(id: number): Promise<EntityRef> {
		const [result] = await this.db
			.delete(goodsReceiptNotesTable)
			.where(eq(goodsReceiptNotesTable.id, id))
			.returning({ id: goodsReceiptNotesTable.id })
		if (!result) throw new Error('GRN not found')
		return { id: result.id }
	}
}

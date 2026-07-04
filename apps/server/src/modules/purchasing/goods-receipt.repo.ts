import { and, count, eq, isNull, or, SQL } from 'drizzle-orm'

import { goodsReceiptNoteItemsTable, goodsReceiptNotesTable } from '@/db/schema'

import { paginate, searchFilter, sortBy, type DbContext } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	GoodsReceiptNoteCreateDto,
	GoodsReceiptNoteDto,
	GoodsReceiptNoteFilterDto,
	GoodsReceiptNoteSelectDto,
	GoodsReceiptStatus,
} from './goods-receipt.contract'

export interface IGoodsReceiptRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<GoodsReceiptNoteDto | undefined>
	findPage(filter: GoodsReceiptNoteFilterDto, db?: DbContext): Promise<WithPaginationResult<GoodsReceiptNoteSelectDto>>
	insert(data: GoodsReceiptNoteCreateDto, actorId: ActorId, db?: DbContext): Promise<EntityRef | undefined>
	updateStatus(id: number, status: GoodsReceiptStatus, actorId: ActorId, db?: DbContext): Promise<EntityRef | undefined>
	softDelete(id: number, actorId: ActorId, db?: DbContext): Promise<EntityRef | undefined>
	hardDelete(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class GoodsReceiptRepo implements IGoodsReceiptRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter: Partial<Pick<GoodsReceiptNoteFilterDto, 'q' | 'status' | 'orderId' | 'locationId' | 'supplierId'>>): SQL | undefined {
		const { q, status, orderId, locationId, supplierId } = filter
		return and(
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
	}

	async findById(id: number, db: DbContext = this.db): Promise<GoodsReceiptNoteDto | undefined> {
		const [grn] = await db
			.select()
			.from(goodsReceiptNotesTable)
			.where(and(eq(goodsReceiptNotesTable.id, id), isNull(goodsReceiptNotesTable.deletedAt)))
			.limit(1)

		if (!grn) return undefined

		const items = await db
			.select()
			.from(goodsReceiptNoteItemsTable)
			.where(
				and(eq(goodsReceiptNoteItemsTable.grnId, id), isNull(goodsReceiptNoteItemsTable.deletedAt)),
			)

		return { ...grn, items } as GoodsReceiptNoteDto
	}

	async findPage(
		filter: GoodsReceiptNoteFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<GoodsReceiptNoteSelectDto>> {
		const where = this.#buildWhere(filter)

		return paginate<GoodsReceiptNoteSelectDto>({
			data: async ({ limit, offset }) => {
				const rows = await db
					.select()
					.from(goodsReceiptNotesTable)
					.where(where)
					.orderBy(sortBy(goodsReceiptNotesTable.updatedAt, 'desc'))
					.limit(limit)
					.offset(offset)
				return rows as GoodsReceiptNoteSelectDto[]
			},
			pq: filter,
			countQuery: () =>
				db.select({ count: count() }).from(goodsReceiptNotesTable).where(where),
		})
	}

	async insert(data: GoodsReceiptNoteCreateDto, actorId: ActorId, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const result = await db.transaction(async (tx) => {
			const { items, ...headerData } = data
			const meta = stampCreate(actorId)

			const [insertedGrn] = await tx
				.insert(goodsReceiptNotesTable)
				.values({ ...headerData, ...meta })
				.returning({ id: goodsReceiptNotesTable.id })

			if (!insertedGrn) return undefined

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

	async updateStatus(id: number, status: GoodsReceiptStatus, actorId: ActorId, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(goodsReceiptNotesTable)
			.set({ status, ...stampUpdate(actorId) })
			.where(eq(goodsReceiptNotesTable.id, id))
			.returning({ id: goodsReceiptNotesTable.id })
		return result
	}

	async softDelete(id: number, actorId: ActorId, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.update(goodsReceiptNotesTable)
			.set({ deletedAt: new Date(), deletedBy: actorId, ...stampUpdate(actorId) })
			.where(eq(goodsReceiptNotesTable.id, id))
			.returning({ id: goodsReceiptNotesTable.id })
		return result
	}

	async hardDelete(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [result] = await db
			.delete(goodsReceiptNotesTable)
			.where(eq(goodsReceiptNotesTable.id, id))
			.returning({ id: goodsReceiptNotesTable.id })
		return result
	}
}

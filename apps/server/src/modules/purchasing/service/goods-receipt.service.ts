import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull, or } from 'drizzle-orm'

import * as core from '@/core/database'
import { db } from '@/db'
import { goodsReceiptNoteItemsTable, goodsReceiptNotesTable } from '@/db/schema'

import * as dto from '../dto/goods-receipt.dto'

// Goods Receipt Service (Layer 2)
// Handles material intake against POs.
export class GoodsReceiptService {
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
        .where(and(eq(goodsReceiptNoteItemsTable.grnId, first.id), isNull(goodsReceiptNoteItemsTable.deletedAt)))

      return dto.GoodsReceiptNoteDto.parse({ ...first, items })
    })
    return result
  }

  async handleList(filter: dto.GoodsReceiptNoteFilterDto): Promise<core.WithPaginationResult<dto.GoodsReceiptNoteBaseDto>> {
    const result = await record('GoodsReceiptService.handleList', async () => {
      const { q, page, limit, status, orderId, locationId, supplierId } = filter
      const where = and(
        isNull(goodsReceiptNotesTable.deletedAt),
        q === undefined
          ? undefined
          : or(
              core.searchFilter(goodsReceiptNotesTable.referenceNumber, q),
              core.searchFilter(goodsReceiptNotesTable.notes, q)
            ),
        status === undefined ? undefined : eq(goodsReceiptNotesTable.status, status),
        orderId === undefined ? undefined : eq(goodsReceiptNotesTable.orderId, orderId),
        locationId === undefined ? undefined : eq(goodsReceiptNotesTable.locationId, locationId),
        supplierId === undefined ? undefined : eq(goodsReceiptNotesTable.supplierId, supplierId)
      )

      const p = await core.paginate<dto.GoodsReceiptNoteBaseDto>({
        data: async ({ limit: l, offset }) => {
          const rows = await db
            .select()
            .from(goodsReceiptNotesTable)
            .where(where)
            .orderBy(core.sortBy(goodsReceiptNotesTable.updatedAt, 'desc'))
            .limit(l)
            .offset(offset)
          return rows.map((r) => dto.GoodsReceiptNoteBaseDto.parse(r))
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

  async handleCreate(data: dto.GoodsReceiptNoteCreateDto, actorId: number): Promise<{ id: number }> {
    const result = await record('GoodsReceiptService.handleCreate', async () => {
      return db.transaction(async (tx) => {
        const { items, ...headerData } = data

        const [insertedGrn] = await tx
          .insert(goodsReceiptNotesTable)
          .values({ 
            ...headerData, 
            ...core.stampCreate(actorId) 
          })
          .returning({ id: goodsReceiptNotesTable.id })
        
        if (!insertedGrn) throw new Error('Create GRN header failed')

        const itemValues = items.map(item => {
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

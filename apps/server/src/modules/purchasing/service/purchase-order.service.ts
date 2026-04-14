import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull, or } from 'drizzle-orm'

import * as core from '@/core/database'
import { db } from '@/db'
import { purchaseOrderItemsTable, purchaseOrdersTable } from '@/db/schema'

import * as dto from '../dto/purchase-order.dto'

// Purchasing Service (Layer 2)
// Handles simple workflow for Purchase Orders and their items.
export class PurchaseOrderService {
  async getById(id: number): Promise<dto.PurchaseOrderDto> {
    const result = await record('PurchaseOrderService.getById', async () => {
      const rows = await db
        .select()
        .from(purchaseOrdersTable)
        .where(and(eq(purchaseOrdersTable.id, id), isNull(purchaseOrdersTable.deletedAt)))
      const first = core.takeFirstOrThrow(rows, `Purchase Order with ID ${id} not found`, 'PURCHASE_ORDER_NOT_FOUND')

      const items = await db
        .select()
        .from(purchaseOrderItemsTable)
        .where(and(eq(purchaseOrderItemsTable.orderId, first.id), isNull(purchaseOrderItemsTable.deletedAt)))

      return dto.PurchaseOrderDto.parse({ ...first, items })
    })
    return result
  }

  async handleList(filter: dto.PurchaseOrderFilterDto): Promise<core.WithPaginationResult<dto.PurchaseOrderBaseDto>> {
    const result = await record('PurchaseOrderService.handleList', async () => {
      const { q, page, limit, status, locationId, supplierId } = filter
      const where = and(
        isNull(purchaseOrdersTable.deletedAt),
        q === undefined ? undefined : or(core.searchFilter(purchaseOrdersTable.notes, q)),
        status === undefined ? undefined : eq(purchaseOrdersTable.status, status),
        locationId === undefined ? undefined : eq(purchaseOrdersTable.locationId, locationId),
        supplierId === undefined ? undefined : eq(purchaseOrdersTable.supplierId, supplierId),
      )

      const p = await core.paginate<dto.PurchaseOrderBaseDto>({
        data: async ({ limit: l, offset }) => {
          const rows = await db
            .select()
            .from(purchaseOrdersTable)
            .where(where)
            .orderBy(core.sortBy(purchaseOrdersTable.updatedAt, 'desc'))
            .limit(l)
            .offset(offset)
          return rows.map((r) => dto.PurchaseOrderBaseDto.parse(r))
        },
        pq: { page, limit },
        countQuery: db.select({ count: count() }).from(purchaseOrdersTable).where(where),
      })
      return p
    })
    return result
  }

  async handleDetail(id: number): Promise<dto.PurchaseOrderDto> {
    const result = await record('PurchaseOrderService.handleDetail', async () => {
      const detail = await this.getById(id)
      return detail
    })
    return result
  }

  async handleCreate(data: dto.PurchaseOrderCreateDto, actorId: number): Promise<{ id: number }> {
    const result = await record('PurchaseOrderService.handleCreate', async () => {
      return db.transaction(async (tx) => {
        const { items, ...orderData } = data

        const [insertedOrder] = await tx
          .insert(purchaseOrdersTable)
          .values({
            ...orderData,
            totalAmount: orderData.totalAmount?.toString() ?? '0',
            discountAmount: orderData.discountAmount?.toString() ?? '0',
            taxAmount: orderData.taxAmount?.toString() ?? '0',
            ...core.stampCreate(actorId),
          })
          .returning({ id: purchaseOrdersTable.id })

        if (!insertedOrder) throw new Error('Create PO failed')

        const itemValues = items.map((item) => {
          const stamp = core.stampCreate(actorId)
          return Object.assign(
            {
              materialId: item.materialId,
              itemName: item.itemName,
              quantity: item.quantity?.toString(),
              unitPrice: item.unitPrice?.toString(),
              discountAmount: item.discountAmount?.toString(),
              taxAmount: item.taxAmount?.toString(),
              subtotal: item.subtotal?.toString(),
              orderId: insertedOrder.id,
            },
            stamp,
          )
        })

        await tx.insert(purchaseOrderItemsTable).values(itemValues)

        return insertedOrder
      })
    })
    return result
  }

  async handleUpdate(
    id: number,
    data: Omit<dto.PurchaseOrderUpdateDto, 'id'>,
    actorId: number,
  ): Promise<{ id: number }> {
    const result = await record('PurchaseOrderService.handleUpdate', async () => {
      await this.getById(id)

      return db.transaction(async (tx) => {
        const { totalAmount, discountAmount, taxAmount, items, ...remData } = data

        await tx
          .update(purchaseOrdersTable)
          .set({
            ...remData,
            ...(totalAmount !== undefined && { totalAmount: totalAmount.toString() }),
            ...(discountAmount !== undefined && { discountAmount: discountAmount.toString() }),
            ...(taxAmount !== undefined && { taxAmount: taxAmount.toString() }),
            ...core.stampUpdate(actorId),
          })
          .where(eq(purchaseOrdersTable.id, id))

        if (items) {
          // Simplistic replace-all for items, can be optimized later
          await tx.delete(purchaseOrderItemsTable).where(eq(purchaseOrderItemsTable.orderId, id))

          const itemValues = items.map((item) => {
            const stamp = core.stampCreate(actorId)
            return Object.assign(
              {
                materialId: item.materialId,
                itemName: item.itemName,
                quantity: item.quantity?.toString(),
                unitPrice: item.unitPrice?.toString(),
                discountAmount: item.discountAmount?.toString(),
                taxAmount: item.taxAmount?.toString(),
                subtotal: item.subtotal?.toString(),
                orderId: id,
              },
              stamp,
            )
          })

          if (itemValues.length > 0) {
            await tx.insert(purchaseOrderItemsTable).values(itemValues)
          }
        }

        return { id }
      })
    })
    return result
  }

  async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
    return record('PurchaseOrderService.handleRemove', async () => {
      const [result] = await db
        .update(purchaseOrdersTable)
        .set({ deletedAt: new Date(), deletedBy: actorId })
        .where(eq(purchaseOrdersTable.id, id))
        .returning({ id: purchaseOrdersTable.id })
      if (!result) throw new Error('Purchase Order not found')
      return result
    })
  }

  async handleHardRemove(id: number): Promise<{ id: number }> {
    return record('PurchaseOrderService.handleHardRemove', async () => {
      const [result] = await db
        .delete(purchaseOrdersTable)
        .where(eq(purchaseOrdersTable.id, id))
        .returning({ id: purchaseOrdersTable.id })
      if (!result) throw new Error('Purchase Order not found')
      return result
    })
  }
}

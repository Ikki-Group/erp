import { randomUUID } from 'node:crypto'

import { record } from '@elysiajs/opentelemetry'
import { and, count, desc, eq, gte, ilike, lte, or } from 'drizzle-orm'

import { paginate, stampCreate, takeFirstOrThrow } from '@/core/database'
import { BadRequestError, NotFoundError } from '@/core/http/errors'
import { transformDecimals } from '@/core/utils/decimal'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'
import { db } from '@/db'
import { materialsTable, stockTransactionsTable } from '@/db/schema'
import type { MaterialLocationService } from '@/modules/material/service/material-location.service'

import type {
  AdjustmentTransactionDto,
  PurchaseTransactionDto,
  StockTransactionDto,
  StockTransactionFilterDto,
  StockTransactionSelectDto,
  TransactionResultDto,
  TransferTransactionDto,
} from '../dto'

const err = {
  notFound: (id: number) => new NotFoundError(`Transaction with ID ${id} not found`, 'TRANSACTION_NOT_FOUND'),
  insufficientStock: (materialId: number, available: number, requested: number) =>
    new BadRequestError(
      `Insufficient stock for material ${materialId}: available ${available}, requested ${requested}`,
      'INSUFFICIENT_STOCK',
    ),
  negativeStock: (materialId: number) =>
    new BadRequestError(`Adjustment would result in negative stock for material ${materialId}`, 'NEGATIVE_STOCK'),
}

export class StockTransactionService {
  constructor(private readonly mLocationSvc: MaterialLocationService) {}

  /* ─────────────────────── WAC CALCULATION ─────────────────────── */

  /**
   * Weighted Average Cost calculation for incoming stock.
   * Formula: (currentQty * currentAvgCost + incomingQty * incomingUnitCost) / (currentQty + incomingQty)
   */
  private calculateIncomingWAC(
    currentQty: number,
    currentAvgCost: number,
    incomingQty: number,
    incomingUnitCost: number,
  ): { newQty: number; newAvgCost: number } {
    const newQty = currentQty + incomingQty
    const newAvgCost = newQty > 0 ? (currentQty * currentAvgCost + incomingQty * incomingUnitCost) / newQty : 0

    return { newQty, newAvgCost }
  }

  /* ──────────────────── HANDLER: PURCHASE ──────────────────── */

  /**
   * Record purchase transactions for multiple materials at one location.
   * Each item increases stock and recalculates WAC.
   */
  async handlePurchase(data: PurchaseTransactionDto, actorId: number): Promise<TransactionResultDto> {
    return record('StockTransactionService.handlePurchase', async () => {
      const { locationId, date, referenceNo, notes, items } = data

      await db.transaction(async (tx) => {
        const metadata = stampCreate(actorId)

        for (const item of items) {
          const { materialId, qty, unitCost } = item

          await record(`StockTransactionService.handlePurchase.item:${materialId}`, async () => {
            const assignment = await this.mLocationSvc.findOne(materialId, locationId)

            const { newQty, newAvgCost } = this.calculateIncomingWAC(
              assignment.currentQty,
              assignment.currentAvgCost,
              qty,
              unitCost,
            )

            const totalCost = qty * unitCost
            const newValue = newQty * newAvgCost

            await tx.insert(stockTransactionsTable).values({
              materialId,
              locationId,
              type: 'purchase',
              date,
              referenceNo,
              notes: notes ?? null,
              qty: qty.toString(),
              unitCost: unitCost.toString(),
              totalCost: totalCost.toString(),
              runningQty: newQty.toString(),
              runningAvgCost: newAvgCost.toString(),
              ...metadata,
            })

            await this.mLocationSvc.updateCurrentStock(
              materialId,
              locationId,
              { currentQty: newQty, currentAvgCost: newAvgCost, currentValue: newValue },
              actorId,
            )
          })
        }
      })

      return { count: items.length, referenceNo }
    })
  }

  /* ──────────────────── HANDLER: TRANSFER ──────────────────── */

  /**
   * Transfer multiple materials between two locations.
   * Creates paired journal entries (transfer_out + transfer_in) per item.
   * Transfer cost uses source location's current average cost.
   */
  async handleTransfer(data: TransferTransactionDto, actorId: number): Promise<TransactionResultDto> {
    return record('StockTransactionService.handleTransfer', async () => {
      const { sourceLocationId, destinationLocationId, date, referenceNo, notes, items } = data
      const transferId = randomUUID()

      await db.transaction(async (tx) => {
        const metadata = stampCreate(actorId)

        for (const item of items) {
          const { materialId, qty } = item

          await record(`StockTransactionService.handleTransfer.item:${materialId}`, async () => {
            const sourceAssignment = await this.mLocationSvc.findOne(materialId, sourceLocationId)
            const destAssignment = await this.mLocationSvc.findOne(materialId, destinationLocationId)

            if (sourceAssignment.currentQty < qty) {
              throw err.insufficientStock(materialId, sourceAssignment.currentQty, qty)
            }

            const sourceAvgCost = sourceAssignment.currentAvgCost
            const transferCost = qty * sourceAvgCost

            // ── Transfer OUT (source)
            const sourceNewQty = sourceAssignment.currentQty - qty

            await tx.insert(stockTransactionsTable).values({
              materialId,
              locationId: sourceLocationId,
              type: 'transfer_out',
              date,
              referenceNo,
              notes: notes ?? null,
              qty: qty.toString(),
              unitCost: sourceAvgCost.toString(),
              totalCost: transferCost.toString(),
              counterpartLocationId: destinationLocationId,
              transferId,
              runningQty: sourceNewQty.toString(),
              runningAvgCost: sourceAvgCost.toString(),
              ...metadata,
            })

            // ── Transfer IN (destination)
            const { newQty: destNewQty, newAvgCost: destNewAvgCost } = this.calculateIncomingWAC(
              destAssignment.currentQty,
              destAssignment.currentAvgCost,
              qty,
              sourceAvgCost,
            )

            await tx.insert(stockTransactionsTable).values({
              materialId,
              locationId: destinationLocationId,
              type: 'transfer_in',
              date,
              referenceNo,
              notes: notes ?? null,
              qty: qty.toString(),
              unitCost: sourceAvgCost.toString(),
              totalCost: transferCost.toString(),
              counterpartLocationId: sourceLocationId,
              transferId,
              runningQty: destNewQty.toString(),
              runningAvgCost: destNewAvgCost.toString(),
              ...metadata,
            })

            await Promise.all([
              this.mLocationSvc.updateCurrentStock(
                materialId,
                sourceLocationId,
                { currentQty: sourceNewQty, currentAvgCost: sourceAvgCost, currentValue: sourceNewQty * sourceAvgCost },
                actorId,
              ),
              this.mLocationSvc.updateCurrentStock(
                materialId,
                destinationLocationId,
                { currentQty: destNewQty, currentAvgCost: destNewAvgCost, currentValue: destNewQty * destNewAvgCost },
                actorId,
              ),
            ])
          })
        }
      })

      return { count: items.length, referenceNo }
    })
  }

  /* ──────────────────── HANDLER: ADJUSTMENT ──────────────────── */

  /**
   * Record stock adjustments for multiple materials at one location.
   * - Positive qty: WAC recalculated (uses provided unitCost or current avg cost).
   * - Negative qty: WAC switched off, stock reduced.
   */
  async handleAdjustment(data: AdjustmentTransactionDto, actorId: number): Promise<TransactionResultDto> {
    return record('StockTransactionService.handleAdjustment', async () => {
      const { locationId, date, referenceNo, notes, items } = data

      await db.transaction(async (tx) => {
        const metadata = stampCreate(actorId)

        for (const item of items) {
          const { materialId, qty } = item

          await record(`StockTransactionService.handleAdjustment.item:${materialId}`, async () => {
            const assignment = await this.mLocationSvc.findOne(materialId, locationId)

            let newQty: number
            let newAvgCost: number
            const effectiveUnitCost = item.unitCost ?? assignment.currentAvgCost

            if (qty > 0) {
              const result = this.calculateIncomingWAC(
                assignment.currentQty,
                assignment.currentAvgCost,
                qty,
                effectiveUnitCost,
              )
              newQty = result.newQty
              newAvgCost = result.newAvgCost
            } else {
              newQty = assignment.currentQty + qty
              newAvgCost = assignment.currentAvgCost

              if (newQty < 0) throw err.negativeStock(materialId)
            }

            const totalCost = Math.abs(qty) * effectiveUnitCost
            const newValue = newQty * newAvgCost

            await tx.insert(stockTransactionsTable).values({
              materialId,
              locationId,
              type: 'adjustment',
              date,
              referenceNo,
              notes: notes ?? null,
              qty: qty.toString(),
              unitCost: effectiveUnitCost.toString(),
              totalCost: totalCost.toString(),
              runningQty: newQty.toString(),
              runningAvgCost: newAvgCost.toString(),
              ...metadata,
            })

            await this.mLocationSvc.updateCurrentStock(
              materialId,
              locationId,
              { currentQty: newQty, currentAvgCost: newAvgCost, currentValue: newValue },
              actorId,
            )
          })
        }
      })

      return { count: items.length, referenceNo }
    })
  }

  /* ──────────────────── HANDLER: LIST ──────────────────── */

  /**
   * List transactions with filters (paginated), enriched with material info.
   */
  async handleList(
    filter: StockTransactionFilterDto,
    pq: PaginationQuery,
  ): Promise<WithPaginationResult<StockTransactionSelectDto>> {
    return record('StockTransactionService.handleList', async () => {
      const { locationId, materialId, type, search, dateFrom, dateTo } = filter

      const searchCondition = search
        ? or(
            ilike(materialsTable.name, `%${search}%`),
            ilike(materialsTable.sku, `%${search}%`),
            ilike(stockTransactionsTable.referenceNo, `%${search}%`),
          )
        : undefined

      const dateCondition =
        dateFrom && dateTo
          ? and(gte(stockTransactionsTable.date, dateFrom), lte(stockTransactionsTable.date, dateTo))
          : dateFrom
            ? gte(stockTransactionsTable.date, dateFrom)
            : dateTo
              ? lte(stockTransactionsTable.date, dateTo)
              : undefined

      const where = and(
        locationId === undefined ? undefined : eq(stockTransactionsTable.locationId, locationId),
        materialId === undefined ? undefined : eq(stockTransactionsTable.materialId, materialId),
        type === undefined ? undefined : eq(stockTransactionsTable.type, type),
        dateCondition,
        searchCondition,
      )

      const result = await paginate({
        data: ({ limit, offset }) =>
          db
            .select({
              id: stockTransactionsTable.id,
              materialId: stockTransactionsTable.materialId,
              locationId: stockTransactionsTable.locationId,
              type: stockTransactionsTable.type,
              date: stockTransactionsTable.date,
              referenceNo: stockTransactionsTable.referenceNo,
              notes: stockTransactionsTable.notes,
              qty: stockTransactionsTable.qty,
              unitCost: stockTransactionsTable.unitCost,
              totalCost: stockTransactionsTable.totalCost,
              counterpartLocationId: stockTransactionsTable.counterpartLocationId,
              transferId: stockTransactionsTable.transferId,
              runningQty: stockTransactionsTable.runningQty,
              runningAvgCost: stockTransactionsTable.runningAvgCost,
              createdAt: stockTransactionsTable.createdAt,
              updatedAt: stockTransactionsTable.updatedAt,
              createdBy: stockTransactionsTable.createdBy,
              updatedBy: stockTransactionsTable.updatedBy,
              syncAt: stockTransactionsTable.syncAt,
              materialName: materialsTable.name,
              materialSku: materialsTable.sku,
            })
            .from(stockTransactionsTable)
            .innerJoin(materialsTable, eq(stockTransactionsTable.materialId, materialsTable.id))
            .where(where)
            .orderBy(desc(stockTransactionsTable.date))
            .limit(limit)
            .offset(offset),
        pq,
        countQuery: db
          .select({ count: count() })
          .from(stockTransactionsTable)
          .innerJoin(materialsTable, eq(stockTransactionsTable.materialId, materialsTable.id))
          .where(where),
      })

      const data = transformDecimals(result.data) as unknown as StockTransactionSelectDto[]
      return { data, meta: result.meta }
    })
  }

  /* ──────────────────── HANDLER: DETAIL ──────────────────── */

  /**
   * Get a single transaction by ID.
   */
  async handleDetail(id: number): Promise<StockTransactionDto> {
    return record('StockTransactionService.handleDetail', async () => {
      const result = await db.select().from(stockTransactionsTable).where(eq(stockTransactionsTable.id, id))
      const row = takeFirstOrThrow(result, `Transaction with ID ${id} not found`, 'TRANSACTION_NOT_FOUND')

      return transformDecimals(row) as unknown as StockTransactionDto
    })
  }
}

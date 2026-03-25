import { randomUUID } from 'node:crypto'

import { record } from '@elysiajs/opentelemetry'
import { and, count, desc, eq, gte, ilike, lte, or } from 'drizzle-orm'

import { paginate, stampCreate, takeFirstOrThrow } from '@/core/database'
import { BadRequestError, NotFoundError } from '@/core/http/errors'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'
import { db } from '@/db'
import { materialsTable, stockTransactionsTable } from '@/db/schema'
import type { MaterialLocationService } from '@/modules/materials/service/material-location.service'

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
          await record(`StockTransactionService.handlePurchase.item:${item.materialId}`, async () => {
            // Validate assignment & get current stock
            const assignment = await this.mLocationSvc.findOne(item.materialId, locationId)

            // Calculate WAC
            const { newQty, newAvgCost } = this.calculateIncomingWAC(
              assignment.currentQty,
              assignment.currentAvgCost,
              item.qty,
              item.unitCost,
            )
            const totalCost = item.qty * item.unitCost
            const newValue = newQty * newAvgCost

            // Create journal entry
            await tx
              .insert(stockTransactionsTable)
              .values({
                materialId: item.materialId,
                locationId,
                type: 'purchase',
                date,
                referenceNo,
                notes: notes ?? null,
                qty: item.qty.toString(),
                unitCost: item.unitCost.toString(),
                totalCost: totalCost.toString(),
                runningQty: newQty.toString(),
                runningAvgCost: newAvgCost.toString(),
                ...metadata,
              })

            // Update live stock
            await this.mLocationSvc.updateCurrentStock(
              item.materialId,
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
          await record(`StockTransactionService.handleTransfer.item:${item.materialId}`, async () => {
            // Validate both assignments
            const sourceAssignment = await this.mLocationSvc.findOne(item.materialId, sourceLocationId)
            const destAssignment = await this.mLocationSvc.findOne(item.materialId, destinationLocationId)

            // Check sufficient stock at source
            if (sourceAssignment.currentQty < item.qty) {
              throw err.insufficientStock(item.materialId, sourceAssignment.currentQty, item.qty)
            }

            const transferCost = item.qty * sourceAssignment.currentAvgCost

            // ── Transfer OUT (source) — WAC unchanged ──
            const sourceNewQty = sourceAssignment.currentQty - item.qty
            const sourceAvgCost = sourceAssignment.currentAvgCost

            await tx
              .insert(stockTransactionsTable)
              .values({
                materialId: item.materialId,
                locationId: sourceLocationId,
                type: 'transfer_out',
                date,
                referenceNo,
                notes: notes ?? null,
                qty: item.qty.toString(),
                unitCost: sourceAvgCost.toString(),
                totalCost: transferCost.toString(),
                counterpartLocationId: destinationLocationId,
                transferId,
                runningQty: sourceNewQty.toString(),
                runningAvgCost: sourceAvgCost.toString(),
                ...metadata,
              })

            // ── Transfer IN (destination) — WAC recalculated ──
            const { newQty: destNewQty, newAvgCost: destNewAvgCost } = this.calculateIncomingWAC(
              destAssignment.currentQty,
              destAssignment.currentAvgCost,
              item.qty,
              sourceAvgCost,
            )

            await tx
              .insert(stockTransactionsTable)
              .values({
                materialId: item.materialId,
                locationId: destinationLocationId,
                type: 'transfer_in',
                date,
                referenceNo,
                notes: notes ?? null,
                qty: item.qty.toString(),
                unitCost: sourceAvgCost.toString(),
                totalCost: transferCost.toString(),
                counterpartLocationId: sourceLocationId,
                transferId,
                runningQty: destNewQty.toString(),
                runningAvgCost: destNewAvgCost.toString(),
                ...metadata,
              })

            // Update both locations' live stock (run sequentially or via promise.all inside tx isn't strictly necessary but is fine)
            await Promise.all([
              this.mLocationSvc.updateCurrentStock(
                item.materialId,
                sourceLocationId,
                { currentQty: sourceNewQty, currentAvgCost: sourceAvgCost, currentValue: sourceNewQty * sourceAvgCost },
                actorId,
              ),
              this.mLocationSvc.updateCurrentStock(
                item.materialId,
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
   * - Negative qty: WAC unchanged, stock reduced.
   */
  async handleAdjustment(data: AdjustmentTransactionDto, actorId: number): Promise<TransactionResultDto> {
    return record('StockTransactionService.handleAdjustment', async () => {
      const { locationId, date, referenceNo, notes, items } = data

      await db.transaction(async (tx) => {
        const metadata = stampCreate(actorId)

        for (const item of items) {
          await record(`StockTransactionService.handleAdjustment.item:${item.materialId}`, async () => {
            const assignment = await this.mLocationSvc.findOne(item.materialId, locationId)

            let newQty: number
            let newAvgCost: number
            const effectiveUnitCost = item.unitCost ?? assignment.currentAvgCost

            if (item.qty > 0) {
              // Positive adjustment — recalculate WAC
              const result = this.calculateIncomingWAC(
                assignment.currentQty,
                assignment.currentAvgCost,
                item.qty,
                effectiveUnitCost,
              )
              newQty = result.newQty
              newAvgCost = result.newAvgCost
            } else {
              // Negative adjustment — WAC unchanged
              newQty = assignment.currentQty + item.qty
              newAvgCost = assignment.currentAvgCost

              if (newQty < 0) throw err.negativeStock(item.materialId)
            }

            const totalCost = Math.abs(item.qty) * effectiveUnitCost
            const newValue = newQty * newAvgCost

            await tx
              .insert(stockTransactionsTable)
              .values({
                materialId: item.materialId,
                locationId,
                type: 'adjustment',
                date,
                referenceNo,
                notes: notes ?? null,
                qty: item.qty.toString(),
                unitCost: effectiveUnitCost.toString(),
                totalCost: totalCost.toString(),
                runningQty: newQty.toString(),
                runningAvgCost: newAvgCost.toString(),
                ...metadata,
              })

            await this.mLocationSvc.updateCurrentStock(
              item.materialId,
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

      const data = result.data.map((r) => ({
        ...r,
        qty: Number(r.qty),
        unitCost: Number(r.unitCost),
        totalCost: Number(r.totalCost),
        runningQty: Number(r.runningQty),
        runningAvgCost: Number(r.runningAvgCost),
      }))

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

      return {
        ...row,
        qty: Number(row.qty),
        unitCost: Number(row.unitCost),
        totalCost: Number(row.totalCost),
        runningQty: Number(row.runningQty),
        runningAvgCost: Number(row.runningAvgCost),
      }
    })
  }
}

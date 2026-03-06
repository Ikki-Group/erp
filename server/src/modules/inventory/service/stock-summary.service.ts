import { record } from '@elysiajs/opentelemetry'
import { and, asc, count, desc, eq, gte, ilike, lt, lte, or, sql, sum } from 'drizzle-orm'

import { paginate, stampCreate, stampUpdate } from '@/lib/db'
import { toWibDateKey, toWibDayBounds } from '@/lib/utils/date.util'
import type { PaginationQuery, WithPaginationResult } from '@/lib/utils/pagination'

import type { MaterialLocationService } from '@/modules/materials/service/material-location.service'

import { db } from '@/db'
import { materials, stockSummaries, stockTransactions, uoms } from '@/db/schema'

import type {
  GenerateSummaryDto,
  StockLedgerFilterDto,
  StockLedgerSelectDto,
  StockSummaryFilterDto,
  StockSummarySelectDto,
} from '../dto'

export class StockSummaryService {
  constructor(private readonly mLocationSvc: MaterialLocationService) {}

  /* ──────────────────── HANDLER: SUMMARY BY LOCATION ──────────────────── */

  /**
   * List daily summaries for a location within a date range (paginated).
   * Each row = one material on one day.
   */
  async handleByLocation(
    filter: StockSummaryFilterDto,
    pq: PaginationQuery
  ): Promise<WithPaginationResult<StockSummarySelectDto>> {
    return record('StockSummaryService.handleByLocation', async () => {
      const { locationId, materialId, dateFrom, dateTo } = filter

      const where = and(
        eq(stockSummaries.locationId, locationId),
        materialId === undefined ? undefined : eq(stockSummaries.materialId, materialId),
        gte(stockSummaries.date, toWibDateKey(dateFrom)),
        lte(stockSummaries.date, toWibDateKey(dateTo))
      )

      const result = await paginate({
        data: ({ limit, offset }) =>
          db
            .select({
              id: stockSummaries.id,
              materialId: stockSummaries.materialId,
              locationId: stockSummaries.locationId,
              date: stockSummaries.date,
              openingQty: stockSummaries.openingQty,
              openingAvgCost: stockSummaries.openingAvgCost,
              openingValue: stockSummaries.openingValue,
              purchaseQty: stockSummaries.purchaseQty,
              purchaseValue: stockSummaries.purchaseValue,
              transferInQty: stockSummaries.transferInQty,
              transferInValue: stockSummaries.transferInValue,
              transferOutQty: stockSummaries.transferOutQty,
              transferOutValue: stockSummaries.transferOutValue,
              adjustmentQty: stockSummaries.adjustmentQty,
              adjustmentValue: stockSummaries.adjustmentValue,
              sellQty: stockSummaries.sellQty,
              sellValue: stockSummaries.sellValue,
              closingQty: stockSummaries.closingQty,
              closingAvgCost: stockSummaries.closingAvgCost,
              closingValue: stockSummaries.closingValue,
              createdAt: stockSummaries.createdAt,
              updatedAt: stockSummaries.updatedAt,
              createdBy: stockSummaries.createdBy,
              updatedBy: stockSummaries.updatedBy,
              syncAt: stockSummaries.syncAt,
              materialName: materials.name,
              materialSku: materials.sku,
            })
            .from(stockSummaries)
            .innerJoin(materials, eq(stockSummaries.materialId, materials.id))
            .where(where)
            .orderBy(desc(stockSummaries.date))
            .limit(limit)
            .offset(offset),
        pq,
        countQuery: db
          .select({ count: count() })
          .from(stockSummaries)
          .innerJoin(materials, eq(stockSummaries.materialId, materials.id))
          .where(where),
      })

      const data = result.data.map((r) => ({
        ...r,
        openingQty: Number(r.openingQty),
        openingAvgCost: Number(r.openingAvgCost),
        openingValue: Number(r.openingValue),
        purchaseQty: Number(r.purchaseQty),
        purchaseValue: Number(r.purchaseValue),
        transferInQty: Number(r.transferInQty),
        transferInValue: Number(r.transferInValue),
        transferOutQty: Number(r.transferOutQty),
        transferOutValue: Number(r.transferOutValue),
        adjustmentQty: Number(r.adjustmentQty),
        adjustmentValue: Number(r.adjustmentValue),
        sellQty: Number(r.sellQty),
        sellValue: Number(r.sellValue),
        closingQty: Number(r.closingQty),
        closingAvgCost: Number(r.closingAvgCost),
        closingValue: Number(r.closingValue),
      }))

      return { data, meta: result.meta }
    })
  }

  /* ──────────────────── HANDLER: LEDGER MATERIAL ──────────────────── */

  /**
   * Monitor materialized stock ledger (konsolidasi & harian)
   * Fetch paginated materials matching filter, then compute their ledger movements.
   */
  async handleLedger(
    filter: StockLedgerFilterDto,
    pq: PaginationQuery
  ): Promise<WithPaginationResult<StockLedgerSelectDto>> {
    return record('StockSummaryService.handleLedger', async () => {
      const { locationId, materialId, dateFrom, dateTo, search } = filter

      const startKey = toWibDateKey(dateFrom)
      const endKey = toWibDateKey(dateTo)

      // 1. Paginate Materials matching filter
      const matWhere = and(
        materialId === undefined ? undefined : eq(materials.id, materialId),
        search ? or(ilike(materials.name, `%${search}%`), ilike(materials.sku, `%${search}%`)) : undefined
      )

      const matResult = await paginate({
        data: ({ limit, offset }) =>
          db
            .select({
              id: materials.id,
              name: materials.name,
              sku: materials.sku,
              baseUomCode: uoms.code,
            })
            .from(materials)
            .innerJoin(uoms, eq(materials.baseUomId, uoms.id))
            .where(matWhere)
            .orderBy(asc(materials.name))
            .limit(limit)
            .offset(offset),
        pq,
        countQuery: db.select({ count: count() }).from(materials).where(matWhere),
      })

      // If no materials match, return empty early
      if (matResult.data.length === 0) {
        return { data: [], meta: matResult.meta }
      }

      // 2. Compute Ledger Data per Material in current page
      const locFilter = locationId ? sql`AND location_id = ${locationId}` : sql``

      const data: StockLedgerSelectDto[] = await Promise.all(
        matResult.data.map(async (m) => {
          // A. Opening Qty: Sum of the latest closing balance before dateFrom per location
          const openingQuery = sql`
            SELECT SUM("latest"."closingQty") as total_qty
            FROM (
              SELECT DISTINCT ON ("locationId") "closingQty"
              FROM stock_summaries
              WHERE "materialId" = ${m.id} AND "date" < ${startKey.toISOString()} ${locFilter}
              ORDER BY "locationId", "date" DESC
            ) latest
          `
          const [openingRow] = (await db.execute(openingQuery)) as unknown as { total_qty: string | null }[]
          const openingQty = Number(openingRow?.total_qty || 0)

          // B. Movements: Between dateFrom and dateTo
          const movementsWhere = and(
            eq(stockSummaries.materialId, m.id),
            locationId === undefined ? undefined : eq(stockSummaries.locationId, locationId),
            gte(stockSummaries.date, startKey),
            lte(stockSummaries.date, endKey)
          )

          const [movementsRow] = await db
            .select({
              purchaseQty: sum(stockSummaries.purchaseQty),
              transferInQty: sum(stockSummaries.transferInQty),
              transferOutQty: sum(stockSummaries.transferOutQty),
              adjustmentQty: sum(stockSummaries.adjustmentQty),
              sellQty: sum(stockSummaries.sellQty),
            })
            .from(stockSummaries)
            .where(movementsWhere)

          const purchaseQty = Number(movementsRow?.purchaseQty || 0)
          const transferInQty = Number(movementsRow?.transferInQty || 0)
          const transferOutQty = Number(movementsRow?.transferOutQty || 0)
          const adjustmentQty = Number(movementsRow?.adjustmentQty || 0)
          const sellQty = Number(movementsRow?.sellQty || 0)

          // C. Closing Balance: Sum of the latest closing balance up to dateTo per location
          const closingQuery = sql`
            SELECT SUM("latest"."closingQty") as total_qty, SUM("latest"."closingValue") as total_value
            FROM (
              SELECT DISTINCT ON ("locationId") "closingQty", "closingValue"
              FROM stock_summaries
              WHERE "materialId" = ${m.id} AND "date" <= ${endKey.toISOString()} ${locFilter.queryChunks}
              ORDER BY "locationId", "date" DESC
            ) latest
          `
          const [closingRow] = (await db.execute(closingQuery)) as unknown as {
            total_qty: string | null
            total_value: string | null
          }[]

          const closingQty = Number(closingRow?.total_qty || 0)
          const closingValue = Number(closingRow?.total_value || 0)
          const closingAvgCost = closingQty === 0 ? 0 : Math.abs(closingValue / closingQty)

          return {
            materialId: m.id,
            materialName: m.name,
            materialSku: m.sku,
            baseUomCode: m.baseUomCode,
            openingQty,
            purchaseQty,
            transferInQty,
            transferOutQty,
            sellQty,
            adjustmentQty,
            closingQty,
            closingValue,
            closingAvgCost,
          }
        })
      )

      return { data, meta: matResult.meta }
    })
  }

  /* ──────────────────── HANDLER: GENERATE DAILY SUMMARY ──────────────────── */

  /**
   * Generate or regenerate daily summary for all materials at a location.
   * Aggregates transactions within the WIB day and computes opening/closing balances.
   */
  async handleGenerate(data: GenerateSummaryDto, actorId: number): Promise<{ generatedCount: number }> {
    return record('StockSummaryService.handleGenerate', async () => {
      const { locationId, date } = data
      const dateKey = toWibDateKey(date)
      const { start, end } = toWibDayBounds(date)

      // Get all material assignments for this location
      const assignments = await this.mLocationSvc.findByLocationId(locationId)
      if (assignments.length === 0) return { generatedCount: 0 }

      let generatedCount = 0

      for (const assignment of assignments) {
        const { materialId } = assignment

        // Get previous day's closing (= today's opening)
        const [previousSummary] = await db
          .select({ closingQty: stockSummaries.closingQty, closingAvgCost: stockSummaries.closingAvgCost })
          .from(stockSummaries)
          .where(
            and(
              eq(stockSummaries.materialId, materialId),
              eq(stockSummaries.locationId, locationId),
              lt(stockSummaries.date, dateKey)
            )
          )
          .orderBy(desc(stockSummaries.date))
          .limit(1)

        const openingQty = previousSummary ? Number(previousSummary.closingQty) : 0
        const openingAvgCost = previousSummary ? Number(previousSummary.closingAvgCost) : 0
        const openingValue = openingQty * openingAvgCost

        // Aggregate transactions for this material+location on this WIB day
        const movements = await db
          .select({
            type: stockTransactions.type,
            qty: sum(stockTransactions.qty),
            totalCost: sum(stockTransactions.totalCost),
          })
          .from(stockTransactions)
          .where(
            and(
              eq(stockTransactions.materialId, materialId),
              eq(stockTransactions.locationId, locationId),
              gte(stockTransactions.date, start),
              lt(stockTransactions.date, end)
            )
          )
          .groupBy(stockTransactions.type)

        let purchaseQty = 0,
          purchaseValue = 0
        let transferInQty = 0,
          transferInValue = 0
        let transferOutQty = 0,
          transferOutValue = 0
        let adjustmentQty = 0,
          adjustmentValue = 0
        let sellQty = 0,
          sellValue = 0

        for (const m of movements) {
          const mQty = Number(m.qty ?? 0)
          const mTotalCost = Number(m.totalCost ?? 0)

          switch (m.type) {
            case 'purchase': {
              purchaseQty += mQty
              purchaseValue += mTotalCost
              break
            }
            case 'transfer_in': {
              transferInQty += mQty
              transferInValue += mTotalCost
              break
            }
            case 'transfer_out': {
              transferOutQty += mQty
              transferOutValue += mTotalCost
              break
            }
            case 'adjustment': {
              adjustmentQty += mQty
              adjustmentValue += mTotalCost
              break
            }
            case 'sell': {
              sellQty += mQty
              sellValue += mTotalCost
              break
            }
          }
        }

        // Calculate closing balance
        const closingQty = openingQty + purchaseQty + transferInQty - transferOutQty + adjustmentQty - sellQty

        // Get the last transaction's running avg cost for the day, or use opening if no transactions
        const [lastTransaction] = await db
          .select({ runningAvgCost: stockTransactions.runningAvgCost })
          .from(stockTransactions)
          .where(
            and(
              eq(stockTransactions.materialId, materialId),
              eq(stockTransactions.locationId, locationId),
              gte(stockTransactions.date, start),
              lt(stockTransactions.date, end)
            )
          )
          .orderBy(desc(stockTransactions.id))
          .limit(1)

        const closingAvgCost = lastTransaction ? Number(lastTransaction.runningAvgCost) : openingAvgCost
        const closingValue = closingQty * closingAvgCost

        // Check if summary exists for this day
        const [existing] = await db
          .select({ id: stockSummaries.id })
          .from(stockSummaries)
          .where(
            and(
              eq(stockSummaries.materialId, materialId),
              eq(stockSummaries.locationId, locationId),
              eq(stockSummaries.date, dateKey)
            )
          )
          .limit(1)

        await (existing
          ? db
              .update(stockSummaries)
              .set({
                openingQty: openingQty.toString(),
                openingAvgCost: openingAvgCost.toString(),
                openingValue: openingValue.toString(),
                purchaseQty: purchaseQty.toString(),
                purchaseValue: purchaseValue.toString(),
                transferInQty: transferInQty.toString(),
                transferInValue: transferInValue.toString(),
                transferOutQty: transferOutQty.toString(),
                transferOutValue: transferOutValue.toString(),
                adjustmentQty: adjustmentQty.toString(),
                adjustmentValue: adjustmentValue.toString(),
                sellQty: sellQty.toString(),
                sellValue: sellValue.toString(),
                closingQty: closingQty.toString(),
                closingAvgCost: closingAvgCost.toString(),
                closingValue: closingValue.toString(),
                ...stampUpdate(actorId),
              })
              .where(eq(stockSummaries.id, existing.id))
          : db.insert(stockSummaries).values({
              materialId,
              locationId,
              date: dateKey,
              openingQty: openingQty.toString(),
              openingAvgCost: openingAvgCost.toString(),
              openingValue: openingValue.toString(),
              purchaseQty: purchaseQty.toString(),
              purchaseValue: purchaseValue.toString(),
              transferInQty: transferInQty.toString(),
              transferInValue: transferInValue.toString(),
              transferOutQty: transferOutQty.toString(),
              transferOutValue: transferOutValue.toString(),
              adjustmentQty: adjustmentQty.toString(),
              adjustmentValue: adjustmentValue.toString(),
              sellQty: sellQty.toString(),
              sellValue: sellValue.toString(),
              closingQty: closingQty.toString(),
              closingAvgCost: closingAvgCost.toString(),
              closingValue: closingValue.toString(),
              ...stampCreate(actorId),
            }))

        generatedCount++
      }

      return { generatedCount }
    })
  }
}

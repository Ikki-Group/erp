import { record } from '@elysiajs/opentelemetry'
import { and, count, desc, eq, gte, lt, lte, sum } from 'drizzle-orm'

import { paginate, stampCreate, stampUpdate } from '@/lib/db'
import { toWibDateKey, toWibDayBounds } from '@/lib/utils/date.util'
import type { PaginationQuery, WithPaginationResult } from '@/lib/utils/pagination'

import type { MaterialLocationService } from '@/modules/materials/service/material-location.service'

import { db } from '@/db'
import { materials, stockSummaries, stockTransactions } from '@/db/schema'

import type { GenerateSummaryDto, StockSummaryFilterDto, StockSummarySelectDto } from '../dto'

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

        await (existing ? db
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
            .where(eq(stockSummaries.id, existing.id)) : db.insert(stockSummaries).values({
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
          }));

        generatedCount++
      }

      return { generatedCount }
    })
  }
}

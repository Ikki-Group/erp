import { record } from '@elysiajs/opentelemetry'
import { and, asc, count, desc, eq, gte, ilike, inArray, lt, lte, or, sql, sum } from 'drizzle-orm'

import { materialsTable, stockSummariesTable, stockTransactionsTable, uomsTable } from '@/db/schema'

import type { MaterialLocationService } from '@/modules/materials/service/material-location.service'

import { paginate, stampCreate } from '@/core/database'
import { toWibDateKey, toWibDayBounds } from '@/core/utils/date.util'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'
import { db } from '@/db'

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
        eq(stockSummariesTable.locationId, locationId),
        materialId === undefined ? undefined : eq(stockSummariesTable.materialId, materialId),
        gte(stockSummariesTable.date, toWibDateKey(dateFrom)),
        lte(stockSummariesTable.date, toWibDateKey(dateTo))
      )

      const result = await paginate({
        data: ({ limit, offset }) =>
          db
            .select({
              id: stockSummariesTable.id,
              materialId: stockSummariesTable.materialId,
              locationId: stockSummariesTable.locationId,
              date: stockSummariesTable.date,
              openingQty: stockSummariesTable.openingQty,
              openingAvgCost: stockSummariesTable.openingAvgCost,
              openingValue: stockSummariesTable.openingValue,
              purchaseQty: stockSummariesTable.purchaseQty,
              purchaseValue: stockSummariesTable.purchaseValue,
              transferInQty: stockSummariesTable.transferInQty,
              transferInValue: stockSummariesTable.transferInValue,
              transferOutQty: stockSummariesTable.transferOutQty,
              transferOutValue: stockSummariesTable.transferOutValue,
              adjustmentQty: stockSummariesTable.adjustmentQty,
              adjustmentValue: stockSummariesTable.adjustmentValue,
              sellQty: stockSummariesTable.sellQty,
              sellValue: stockSummariesTable.sellValue,
              closingQty: stockSummariesTable.closingQty,
              closingAvgCost: stockSummariesTable.closingAvgCost,
              closingValue: stockSummariesTable.closingValue,
              createdAt: stockSummariesTable.createdAt,
              updatedAt: stockSummariesTable.updatedAt,
              createdBy: stockSummariesTable.createdBy,
              updatedBy: stockSummariesTable.updatedBy,
              syncAt: stockSummariesTable.syncAt,
              materialName: materialsTable.name,
              materialSku: materialsTable.sku,
            })
            .from(stockSummariesTable)
            .innerJoin(materialsTable, eq(stockSummariesTable.materialId, materialsTable.id))
            .where(where)
            .orderBy(desc(stockSummariesTable.date))
            .limit(limit)
            .offset(offset),
        pq,
        countQuery: db
          .select({ count: count() })
          .from(stockSummariesTable)
          .innerJoin(materialsTable, eq(stockSummariesTable.materialId, materialsTable.id))
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
        materialId === undefined ? undefined : eq(materialsTable.id, materialId),
        search ? or(ilike(materialsTable.name, `%${search}%`), ilike(materialsTable.sku, `%${search}%`)) : undefined
      )

      const matResult = await paginate({
        data: ({ limit, offset }) =>
          db
            .select({
              id: materialsTable.id,
              name: materialsTable.name,
              sku: materialsTable.sku,
              baseUomCode: uomsTable.code,
            })
            .from(materialsTable)
            .innerJoin(uomsTable, eq(materialsTable.baseUomId, uomsTable.id))
            .where(matWhere)
            .orderBy(asc(materialsTable.name))
            .limit(limit)
            .offset(offset),
        pq,
        countQuery: db.select({ count: count() }).from(materialsTable).where(matWhere),
      })

      // If no materials match, return empty early
      if (matResult.data.length === 0) {
        return { data: [], meta: matResult.meta }
      }

      const materialIds = matResult.data.map((m) => m.id)

      // 2. Compute Ledger Data for all materials in current page
      const locFilter = locationId ? sql`AND "locationId" = ${locationId}` : sql``

      // A. Opening Qty: Sum of the latest closing balance before dateFrom per location
      const openingQuery = sql`
        SELECT "materialId", SUM("closingQty") as total_qty
        FROM (
          SELECT DISTINCT ON ("materialId", "locationId") "materialId", "closingQty"
          FROM stock_summaries
          WHERE "materialId" IN ${materialIds} AND "date" < ${startKey.toISOString()} ${locFilter}
          ORDER BY "materialId", "locationId", "date" DESC
        ) latest
        GROUP BY "materialId"
      `
      const openingRaw = (await db.execute(openingQuery)) as unknown as { materialId: number; total_qty: string }[]
      const openingMap = new Map(openingRaw.map((r) => [r.materialId, Number(r.total_qty)]))

      // B. Movements: Sum of all daily movements within date range
      const movements = await db
        .select({
          materialId: stockSummariesTable.materialId,
          purchaseQty: sum(stockSummariesTable.purchaseQty),
          transferInQty: sum(stockSummariesTable.transferInQty),
          transferOutQty: sum(stockSummariesTable.transferOutQty),
          adjustmentQty: sum(stockSummariesTable.adjustmentQty),
          sellQty: sum(stockSummariesTable.sellQty),
        })
        .from(stockSummariesTable)
        .where(
          and(
            inArray(stockSummariesTable.materialId, materialIds),
            locationId === undefined ? undefined : eq(stockSummariesTable.locationId, locationId),
            gte(stockSummariesTable.date, startKey),
            lte(stockSummariesTable.date, endKey)
          )
        )
        .groupBy(stockSummariesTable.materialId)

      const movementMap = new Map(movements.map((m) => [m.materialId, m]))

      // C. Closing Balance: Sum of the latest closing balance up to dateTo per location
      const closingQuery = sql`
        SELECT "materialId", SUM("closingQty") as total_qty, SUM("closingValue") as total_value
        FROM (
          SELECT DISTINCT ON ("materialId", "locationId") "materialId", "closingQty", "closingValue"
          FROM stock_summaries
          WHERE "materialId" IN ${materialIds} AND "date" <= ${endKey.toISOString()} ${locFilter}
          ORDER BY "materialId", "locationId", "date" DESC
        ) latest
        GROUP BY "materialId"
      `
      const closingRaw = (await db.execute(closingQuery)) as unknown as {
        materialId: number
        total_qty: string
        total_value: string
      }[]
      const closingMap = new Map(closingRaw.map((r) => [r.materialId, r]))

      // 3. Map into final DTO
      const data: StockLedgerSelectDto[] = matResult.data.map((m) => {
        const mv = movementMap.get(m.id)
        const cl = closingMap.get(m.id)

        const openingQty = openingMap.get(m.id) || 0
        const purchaseQty = Number(mv?.purchaseQty || 0)
        const transferInQty = Number(mv?.transferInQty || 0)
        const transferOutQty = Number(mv?.transferOutQty || 0)
        const adjustmentQty = Number(mv?.adjustmentQty || 0)
        const sellQty = Number(mv?.sellQty || 0)

        const closingQty = Number(cl?.total_qty || 0)
        const closingValue = Number(cl?.total_value || 0)
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

      // 1. Get all assigned materials for this location
      const assignments = await this.mLocationSvc.findByLocationId(locationId)
      if (assignments.length === 0) return { generatedCount: 0 }

      const materialIds = assignments.map((a) => a.materialId)

      return await db.transaction(async (tx) => {
        // 2. Bulk fetch previous summaries (latest per material before today)
        // PostgreSQL: DISTINCT ON is the cleanest way here
        const prevSummariesQuery = sql`
          SELECT DISTINCT ON ("materialId") "materialId", "closingQty", "closingAvgCost"
          FROM ${stockSummariesTable}
          WHERE "locationId" = ${locationId} AND "date" < ${dateKey.toISOString()}
            AND "materialId" IN ${materialIds}
          ORDER BY "materialId", "date" DESC
        `
        const prevSummariesRaw = (await tx.execute(prevSummariesQuery)) as unknown as {
          materialId: number
          closingQty: string
          closingAvgCost: string
        }[]

        const prevMap = new Map(prevSummariesRaw.map((r) => [r.materialId, r]))

        // 3. Bulk fetch today's movements aggregated per material+type
        const movements = await tx
          .select({
            materialId: stockTransactionsTable.materialId,
            type: stockTransactionsTable.type,
            qty: sum(stockTransactionsTable.qty),
            totalCost: sum(stockTransactionsTable.totalCost),
          })
          .from(stockTransactionsTable)
          .where(
            and(
              eq(stockTransactionsTable.locationId, locationId),
              gte(stockTransactionsTable.date, start),
              lt(stockTransactionsTable.date, end),
              inArray(stockTransactionsTable.materialId, materialIds)
            )
          )
          .groupBy(stockTransactionsTable.materialId, stockTransactionsTable.type)

        const movementMap = new Map<number, typeof movements>()
        for (const m of movements) {
          const list = movementMap.get(m.materialId) || []
          list.push(m)
          movementMap.set(m.materialId, list)
        }

        // 4. Bulk fetch today's last transaction per material (for closingAvgCost)
        const lastTransactionsQuery = sql`
          SELECT DISTINCT ON ("materialId") "materialId", "runningAvgCost"
          FROM ${stockTransactionsTable}
          WHERE "locationId" = ${locationId} AND "date" >= ${start.toISOString()} AND "date" < ${end.toISOString()}
            AND "materialId" IN ${materialIds}
          ORDER BY "materialId", "id" DESC
        `
        const lastTransactionsRaw = (await tx.execute(lastTransactionsQuery)) as unknown as {
          materialId: number
          runningAvgCost: string
        }[]
        const lastTxMap = new Map(lastTransactionsRaw.map((r) => [r.materialId, r]))

        // 5. Prepare bulk upsert data
        const upsertData = assignments.map((assignment) => {
          const { materialId } = assignment
          const prev = prevMap.get(materialId)
          const openingQty = prev ? Number(prev.closingQty) : 0
          const openingAvgCost = prev ? Number(prev.closingAvgCost) : 0
          const openingValue = openingQty * openingAvgCost

          const materialMovements = movementMap.get(materialId) || []
          let purchaseQty = 0,
            purchaseValue = 0,
            transferInQty = 0,
            transferInValue = 0,
            transferOutQty = 0,
            transferOutValue = 0,
            adjustmentQty = 0,
            adjustmentValue = 0,
            sellQty = 0,
            sellValue = 0

          for (const m of materialMovements) {
            const qty = Number(m.qty || 0)
            const value = Number(m.totalCost || 0)
            switch (m.type) {
              case 'purchase':
                purchaseQty += qty
                purchaseValue += value
                break
              case 'transfer_in':
                transferInQty += qty
                transferInValue += value
                break
              case 'transfer_out':
                transferOutQty += qty
                transferOutValue += value
                break
              case 'adjustment':
                adjustmentQty += qty
                adjustmentValue += value
                break
              case 'sell':
                sellQty += qty
                sellValue += value
                break
            }
          }

          const closingQty = openingQty + purchaseQty + transferInQty - transferOutQty + adjustmentQty - sellQty
          const lastTx = lastTxMap.get(materialId)
          const closingAvgCost = lastTx ? Number(lastTx.runningAvgCost) : openingAvgCost
          const closingValue = closingQty * closingAvgCost

          return {
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
            updatedAt: new Date(),
            updatedBy: actorId,
          }
        })

        // 6. Bulk Upsert using onConflictDoUpdate
        await tx
          .insert(stockSummariesTable)
          .values(upsertData)
          .onConflictDoUpdate({
            target: [stockSummariesTable.materialId, stockSummariesTable.locationId, stockSummariesTable.date],
            set: {
              openingQty: sql`excluded."openingQty"`,
              openingAvgCost: sql`excluded."openingAvgCost"`,
              openingValue: sql`excluded."openingValue"`,
              purchaseQty: sql`excluded."purchaseQty"`,
              purchaseValue: sql`excluded."purchaseValue"`,
              transferInQty: sql`excluded."transferInQty"`,
              transferInValue: sql`excluded."transferInValue"`,
              transferOutQty: sql`excluded."transferOutQty"`,
              transferOutValue: sql`excluded."transferOutValue"`,
              adjustmentQty: sql`excluded."adjustmentQty"`,
              adjustmentValue: sql`excluded."adjustmentValue"`,
              sellQty: sql`excluded."sellQty"`,
              sellValue: sql`excluded."sellValue"`,
              closingQty: sql`excluded."closingQty"`,
              closingAvgCost: sql`excluded."closingAvgCost"`,
              closingValue: sql`excluded."closingValue"`,
              updatedAt: sql`excluded."updatedAt"`,
              updatedBy: sql`excluded."updatedBy"`,
            },
          })

        return { generatedCount: upsertData.length }
      })
    })
  }
}

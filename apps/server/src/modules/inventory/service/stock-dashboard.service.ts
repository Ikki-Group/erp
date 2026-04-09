import { and, eq, isNull, sql } from 'drizzle-orm'

import { db } from '@/db'
import { materialLocationsTable, materialsTable } from '@/db/schema/material'

import type { DashboardKpiFilterDto } from '../dto'

export class StockDashboardService {
  async handleKpi(filter: DashboardKpiFilterDto) {
    const conditions = [
      isNull(materialLocationsTable.deletedAt),
      isNull(materialsTable.deletedAt),
      filter.locationId ? eq(materialLocationsTable.locationId, filter.locationId) : undefined,
    ]

    const whereClause = and(...conditions.filter(Boolean))

    const res = await db
      .select({
        totalStockValue: sql<number>`COALESCE(SUM(CAST(${materialLocationsTable.currentValue} AS FLOAT)), 0)`,
        totalActiveSku: sql<number>`COUNT(DISTINCT ${materialLocationsTable.materialId})`,
        lowStockCount: sql<number>`CAST(SUM(CASE WHEN ${materialLocationsTable.currentQty} <= ${materialLocationsTable.minStock} OR ${materialLocationsTable.currentQty} <= ${materialLocationsTable.reorderPoint} THEN 1 ELSE 0 END) AS INT)`,
      })
      .from(materialLocationsTable)
      .innerJoin(materialsTable, eq(materialLocationsTable.materialId, materialsTable.id))
      .where(whereClause)

    const row = res[0]

    return {
      totalStockValue: Number(row?.totalStockValue ?? 0),
      totalActiveSku: Number(row?.totalActiveSku ?? 0),
      lowStockCount: Number(row?.lowStockCount ?? 0),
    }
  }
}

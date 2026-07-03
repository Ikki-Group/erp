import { record } from '@elysiajs/opentelemetry'
import { and, eq, sql } from 'drizzle-orm'

import {
	materialLocationsTable,
	materialsTable,
	materialStockSnapshotsTable,
} from '@/db/schema/material'

import type { DbClient } from '@/infra/database'

import { DashboardKpiFilterDto } from './stock-dashboard.contract'

export class StockDashboardRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getKpi(filter: DashboardKpiFilterDto) {
		return record('StockDashboardRepo.getKpi', async () => {
			const conditions = [
				filter.locationId ? eq(materialLocationsTable.locationId, filter.locationId) : undefined,
			]

			const whereClause = and(...conditions.filter(Boolean))

			const res = await this.db
				.select({
					totalStockValue: sql<number>`COALESCE(SUM(CAST(${materialStockSnapshotsTable.currentValue} AS FLOAT)), 0)`,
					totalActiveSku: sql<number>`COUNT(DISTINCT ${materialLocationsTable.materialId})`,
					lowStockCount: sql<number>`CAST(SUM(CASE WHEN CAST(${materialStockSnapshotsTable.currentQty} AS FLOAT) <= CAST(${materialLocationsTable.minStock} AS FLOAT) OR CAST(${materialStockSnapshotsTable.currentQty} AS FLOAT) <= CAST(${materialLocationsTable.reorderPoint} AS FLOAT) THEN 1 ELSE 0 END) AS INT)`,
				})
				.from(materialLocationsTable)
				.innerJoin(materialsTable, eq(materialLocationsTable.materialId, materialsTable.id))
				.leftJoin(
					materialStockSnapshotsTable,
					and(
						eq(materialLocationsTable.materialId, materialStockSnapshotsTable.materialId),
						eq(materialLocationsTable.locationId, materialStockSnapshotsTable.locationId),
					),
				)
				.where(whereClause)

			const row = res[0]

			return {
				totalStockValue: Number(row?.totalStockValue ?? 0),
				totalActiveSku: Number(row?.totalActiveSku ?? 0),
				lowStockCount: Number(row?.lowStockCount ?? 0),
			}
		})
	}
}

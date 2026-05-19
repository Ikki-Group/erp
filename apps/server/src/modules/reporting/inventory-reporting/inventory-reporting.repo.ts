import { and, eq, gte, isNull, lte, or, sql } from 'drizzle-orm'

import { materialLocationsTable, materialsTable, uomsTable, materialStockSnapshotsTable } from '@/db/schema'
import {
	stockTransactionsTable,
	stockAdjustmentsTable,
	stockAdjustmentItemsTable,
} from '@/db/schema/inventory'
import { locationsTable } from '@/db/schema/location'

import type { DbClient } from '@/infra/database'

import type { InventoryReportRequestDto } from './inventory-reporting.dto'

export class InventoryReportingRepo {
	constructor(private readonly db: DbClient) {}

	private buildBaseWhere(query: InventoryReportRequestDto) {
		const { locationId, productId } = query
		return {
			locationId,
			productId,
		}
	}

	async getStockLevels(query: InventoryReportRequestDto) {
		const { locationId, productId } = this.buildBaseWhere(query)

		const conditions = [
			locationId ? eq(materialLocationsTable.locationId, locationId) : undefined,
			productId ? eq(materialLocationsTable.materialId, productId) : undefined,
		]

		const whereClause = and(...conditions.filter(Boolean))

		const data = await this.db
			.select({
				productId: materialLocationsTable.materialId,
				productName: materialsTable.name,
				sku: materialsTable.sku,
				currentStock: sql<number>`CAST(${materialStockSnapshotsTable.currentQty} AS FLOAT)`,
				reorderLevel: sql<number>`CAST(${materialLocationsTable.reorderPoint} AS FLOAT)`,
				unit: sql<string>`COALESCE(${uomsTable.code}, 'unit')`,
			})
			.from(materialLocationsTable)
			.innerJoin(materialsTable, eq(materialLocationsTable.materialId, materialsTable.id))
			.leftJoin(uomsTable, eq(materialsTable.baseUomId, uomsTable.id))
			.leftJoin(
				materialStockSnapshotsTable,
				and(
					eq(materialLocationsTable.materialId, materialStockSnapshotsTable.materialId),
					eq(materialLocationsTable.locationId, materialStockSnapshotsTable.locationId),
				),
			)
			.where(whereClause)
			.orderBy(materialsTable.name)

		const summary = await this.db
			.select({
				total: sql<number>`COALESCE(SUM(CAST(${materialStockSnapshotsTable.currentQty} AS FLOAT)), 0)`,
				count: sql<number>`cast(count(*) as int)`,
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

		return { data, summary: summary[0] }
	}

	async getStockValue(query: InventoryReportRequestDto) {
		const { locationId, productId } = this.buildBaseWhere(query)

		const conditions = [
			locationId ? eq(materialLocationsTable.locationId, locationId) : undefined,
			productId ? eq(materialLocationsTable.materialId, productId) : undefined,
		]

		const whereClause = and(...conditions.filter(Boolean))

		const rows = await this.db
			.select({
				productId: materialLocationsTable.materialId,
				productName: materialsTable.name,
				sku: materialsTable.sku,
				quantity: sql<number>`CAST(${materialStockSnapshotsTable.currentQty} AS FLOAT)`,
				unitCost: sql<number>`CAST(${materialStockSnapshotsTable.currentAvgCost} AS FLOAT)`,
				totalValue: sql<number>`CAST(${materialStockSnapshotsTable.currentValue} AS FLOAT)`,
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
			.orderBy(sql`${materialStockSnapshotsTable.currentValue} DESC`)

		const summary = await this.db
			.select({
				total: sql<number>`COALESCE(SUM(CAST(${materialStockSnapshotsTable.currentValue} AS FLOAT)), 0)`,
				count: sql<number>`cast(count(*) as int)`,
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

		return { rows, summary: summary[0] }
	}

	async getLowStockItems(query: InventoryReportRequestDto) {
		const { locationId, productId } = this.buildBaseWhere(query)

		const conditions = [
			locationId ? eq(materialLocationsTable.locationId, locationId) : undefined,
			productId ? eq(materialLocationsTable.materialId, productId) : undefined,
			or(
				lte(materialStockSnapshotsTable.currentQty, materialLocationsTable.minStock),
				lte(materialStockSnapshotsTable.currentQty, materialLocationsTable.reorderPoint),
			),
		]

		const whereClause = and(...conditions.filter(Boolean))

		const data = await this.db
			.select({
				productId: materialLocationsTable.materialId,
				productName: materialsTable.name,
				sku: materialsTable.sku,
				currentStock: sql<number>`CAST(${materialStockSnapshotsTable.currentQty} AS FLOAT)`,
				reorderLevel: sql<number>`CAST(${materialLocationsTable.reorderPoint} AS FLOAT)`,
				shortage: sql<number>`CAST(${materialLocationsTable.reorderPoint} AS FLOAT) - CAST(${materialStockSnapshotsTable.currentQty} AS FLOAT)`,
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
			.orderBy(sql`${materialStockSnapshotsTable.currentQty}`)

		const summary = await this.db
			.select({
				count: sql<number>`cast(count(*) as int)`,
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

		return { data, summary: summary[0] }
	}

	async getInventoryMovements(query: InventoryReportRequestDto) {
		const { locationId, productId, dateFrom, dateTo } = query

		const conditions = [
			isNull(stockTransactionsTable.deletedAt),
			gte(stockTransactionsTable.date, dateFrom),
			lte(stockTransactionsTable.date, dateTo),
			locationId ? eq(stockTransactionsTable.locationId, locationId) : undefined,
			productId ? eq(stockTransactionsTable.materialId, productId) : undefined,
		]

		const whereClause = and(...conditions.filter(Boolean))

		return this.db
			.select({
				date: stockTransactionsTable.date,
				quantityIn: sql<number>`COALESCE(SUM(CASE WHEN ${stockTransactionsTable.type} IN ('purchase', 'transfer_in', 'production_in') THEN CAST(${stockTransactionsTable.qty} AS FLOAT) ELSE 0 END), 0)`,
				quantityOut: sql<number>`COALESCE(SUM(CASE WHEN ${stockTransactionsTable.type} IN ('sell', 'transfer_out', 'usage', 'production_out') THEN CAST(${stockTransactionsTable.qty} AS FLOAT) ELSE 0 END), 0)`,
				netAdjustment: sql<number>`COALESCE(SUM(CASE WHEN ${stockTransactionsTable.type} = 'adjustment' THEN CAST(${stockTransactionsTable.qty} AS FLOAT) ELSE 0 END), 0)`,
			})
			.from(stockTransactionsTable)
			.where(whereClause)
			.groupBy(stockTransactionsTable.date)
			.orderBy(stockTransactionsTable.date)
	}

	async getOpnameReport(query: InventoryReportRequestDto) {
		const { locationId, productId, dateFrom, dateTo } = query

		return this.db
			.select({
				materialId: materialsTable.id,
				materialName: materialsTable.name,
				locationId: locationsTable.id,
				locationName: locationsTable.name,
				expectedQty: sql<number>`COALESCE(SUM(${stockAdjustmentItemsTable.qtyDiff}) + SUM(${stockAdjustmentItemsTable.qtyDiff}), 0)`,
				actualQty: sql<number>`COALESCE(SUM(${stockAdjustmentItemsTable.qtyDiff}), 0)`,
				variance: sql<number>`COALESCE(SUM(${stockAdjustmentItemsTable.qtyDiff}), 0)`,
				varianceCost: sql<number>`COALESCE(SUM(${stockAdjustmentItemsTable.qtyDiff} * CAST(${stockAdjustmentItemsTable.unitCost} AS FLOAT)), 0)`,
				adjustmentType: stockAdjustmentsTable.type,
				date: stockAdjustmentsTable.adjustmentDate,
			})
			.from(stockAdjustmentsTable)
			.innerJoin(
				stockAdjustmentItemsTable,
				eq(stockAdjustmentsTable.id, stockAdjustmentItemsTable.adjustmentId),
			)
			.innerJoin(materialsTable, eq(stockAdjustmentItemsTable.materialId, materialsTable.id))
			.innerJoin(locationsTable, eq(stockAdjustmentsTable.locationId, locationsTable.id))
			.where(
				and(
					eq(stockAdjustmentsTable.type, 'opname'),
					gte(stockAdjustmentsTable.adjustmentDate, dateFrom),
					lte(stockAdjustmentsTable.adjustmentDate, dateTo),
					locationId ? eq(stockAdjustmentsTable.locationId, locationId) : undefined,
					productId ? eq(stockAdjustmentItemsTable.materialId, productId) : undefined,
				),
			)
			.groupBy(
				materialsTable.id,
				locationsTable.id,
				stockAdjustmentsTable.type,
				stockAdjustmentsTable.adjustmentDate,
			)
			.orderBy(stockAdjustmentsTable.adjustmentDate)
	}

	async getConsumptionReport(query: InventoryReportRequestDto) {
		const { locationId, productId, dateFrom, dateTo } = query

		return this.db
			.select({
				materialId: materialsTable.id,
				materialName: materialsTable.name,
				materialType: materialsTable.type,
				locationId: locationsTable.id,
				locationName: locationsTable.name,
				quantity: sql<number>`COALESCE(SUM(${stockTransactionsTable.qty}), 0)`,
				unit: uomsTable.code,
				cost: sql<number>`COALESCE(SUM(${stockTransactionsTable.qty} * CAST(${stockTransactionsTable.unitCost} AS FLOAT)), 0)`,
				date: stockTransactionsTable.date,
			})
			.from(stockTransactionsTable)
			.innerJoin(materialsTable, eq(stockTransactionsTable.materialId, materialsTable.id))
			.innerJoin(locationsTable, eq(stockTransactionsTable.locationId, locationsTable.id))
			.leftJoin(uomsTable, eq(materialsTable.baseUomId, uomsTable.id))
			.where(
				and(
					gte(stockTransactionsTable.date, dateFrom),
					lte(stockTransactionsTable.date, dateTo),
					eq(stockTransactionsTable.type, 'usage'),
					locationId ? eq(stockTransactionsTable.locationId, locationId) : undefined,
					productId ? eq(stockTransactionsTable.materialId, productId) : undefined,
				),
			)
			.groupBy(materialsTable.id, locationsTable.id, uomsTable.code, stockTransactionsTable.date)
			.orderBy(stockTransactionsTable.date)
	}

	async getWasteReport(query: InventoryReportRequestDto) {
		const { locationId, productId, dateFrom, dateTo } = query

		return this.db
			.select({
				materialId: materialsTable.id,
				materialName: materialsTable.name,
				locationId: locationsTable.id,
				locationName: locationsTable.name,
				quantity: sql<number>`COALESCE(SUM(ABS(${stockAdjustmentItemsTable.qtyDiff})), 0)`,
				unit: uomsTable.code,
				cost: sql<number>`COALESCE(SUM(ABS(${stockAdjustmentItemsTable.qtyDiff}) * CAST(${stockAdjustmentItemsTable.unitCost} AS FLOAT)), 0)`,
				reason: stockAdjustmentsTable.reason,
				date: stockAdjustmentsTable.adjustmentDate,
			})
			.from(stockAdjustmentsTable)
			.innerJoin(
				stockAdjustmentItemsTable,
				eq(stockAdjustmentsTable.id, stockAdjustmentItemsTable.adjustmentId),
			)
			.innerJoin(materialsTable, eq(stockAdjustmentItemsTable.materialId, materialsTable.id))
			.innerJoin(locationsTable, eq(stockAdjustmentsTable.locationId, locationsTable.id))
			.leftJoin(uomsTable, eq(materialsTable.baseUomId, uomsTable.id))
			.where(
				and(
					eq(stockAdjustmentsTable.type, 'waste'),
					gte(stockAdjustmentsTable.adjustmentDate, dateFrom),
					lte(stockAdjustmentsTable.adjustmentDate, dateTo),
					locationId ? eq(stockAdjustmentsTable.locationId, locationId) : undefined,
					productId ? eq(stockAdjustmentItemsTable.materialId, productId) : undefined,
				),
			)
			.groupBy(
				materialsTable.id,
				locationsTable.id,
				uomsTable.code,
				stockAdjustmentsTable.reason,
				stockAdjustmentsTable.adjustmentDate,
			)
			.orderBy(stockAdjustmentsTable.adjustmentDate)
	}
}

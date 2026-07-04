import { and, eq, gte, lte, sql } from 'drizzle-orm'

import {
	locationsTable,
	materialLocationsTable,
	materialsTable,
	purchaseOrderItemsTable,
	purchaseOrdersTable,
	salesOrdersTable,
	materialStockSnapshotsTable,
} from '@/db/schema'
import { stockTransactionsTable } from '@/db/schema/inventory'

import type { DbContext } from '@/infra/database'

import { BusinessInsightsRequestDto } from './business-insights.contract'

export interface IBusinessInsightsRepo {
	readonly db: DbContext
	getRevenueRows(query: BusinessInsightsRequestDto): Promise<Array<{ date: Date; revenue: number }>>
	getCogsRows(query: BusinessInsightsRequestDto): Promise<Array<{ date: Date; cogs: number }>>
	getLocationPerformance(query: BusinessInsightsRequestDto): Promise<Array<{ locationId: number; locationName: string; totalSales: number; totalRevenue: number; totalCost: number }>>
	getCogsRowsForInventoryTurnover(query: BusinessInsightsRequestDto): Promise<Array<{ materialId: number; cogs: number }>>
	getAvgInventoryRows(query: BusinessInsightsRequestDto): Promise<Array<{ materialId: number; avgStock: number }>>
	getMaterialName(materialId: number): Promise<Array<{ name: string }>>
}

export class BusinessInsightsRepo implements IBusinessInsightsRepo {
	constructor(readonly db: DbContext) {}

	async getRevenueRows(query: BusinessInsightsRequestDto) {
		const { dateFrom, dateTo, locationId } = query

		return this.db
			.select({
				date: salesOrdersTable.createdAt,
				revenue: sql<number>`COALESCE(SUM(${salesOrdersTable.totalAmount}), 0)`,
			})
			.from(salesOrdersTable)
			.where(
				and(
					gte(salesOrdersTable.createdAt, dateFrom),
					lte(salesOrdersTable.createdAt, dateTo),
					locationId ? eq(salesOrdersTable.locationId, locationId) : undefined,
				),
			)
			.groupBy(salesOrdersTable.createdAt)
			.orderBy(salesOrdersTable.createdAt)
	}

	async getCogsRows(query: BusinessInsightsRequestDto) {
		const { dateFrom, dateTo, locationId } = query

		return this.db
			.select({
				date: purchaseOrdersTable.transactionDate,
				cogs: sql<number>`COALESCE(SUM(${purchaseOrderItemsTable.subtotal}), 0)`,
			})
			.from(purchaseOrdersTable)
			.innerJoin(
				purchaseOrderItemsTable,
				eq(purchaseOrdersTable.id, purchaseOrderItemsTable.orderId),
			)
			.where(
				and(
					gte(purchaseOrdersTable.transactionDate, dateFrom),
					lte(purchaseOrdersTable.transactionDate, dateTo),
					locationId ? eq(purchaseOrdersTable.locationId, locationId) : undefined,
				),
			)
			.groupBy(purchaseOrdersTable.transactionDate)
			.orderBy(purchaseOrdersTable.transactionDate)
	}

	async getLocationPerformance(query: BusinessInsightsRequestDto) {
		const { dateFrom, dateTo, locationId } = query

		return this.db
			.select({
				locationId: locationsTable.id,
				locationName: locationsTable.name,
				totalSales: sql<number>`COUNT(${salesOrdersTable.id})`,
				totalRevenue: sql<number>`COALESCE(SUM(${salesOrdersTable.totalAmount}), 0)`,
				totalCost: sql<number>`COALESCE(SUM(${purchaseOrderItemsTable.subtotal}), 0)`,
			})
			.from(locationsTable)
			.leftJoin(
				salesOrdersTable,
				and(
					eq(locationsTable.id, salesOrdersTable.locationId),
					gte(salesOrdersTable.createdAt, dateFrom),
					lte(salesOrdersTable.createdAt, dateTo),
				),
			)
			.leftJoin(
				purchaseOrdersTable,
				and(
					eq(locationsTable.id, purchaseOrdersTable.locationId),
					gte(purchaseOrdersTable.transactionDate, dateFrom),
					lte(purchaseOrdersTable.transactionDate, dateTo),
				),
			)
			.leftJoin(
				purchaseOrderItemsTable,
				eq(purchaseOrdersTable.id, purchaseOrderItemsTable.orderId),
			)
			.where(locationId ? eq(locationsTable.id, locationId) : undefined)
			.groupBy(locationsTable.id)
			.orderBy(sql`totalRevenue DESC`)
	}

	async getCogsRowsForInventoryTurnover(query: BusinessInsightsRequestDto) {
		const { dateFrom, dateTo, materialId } = query

		return this.db
			.select({
				materialId: stockTransactionsTable.materialId,
				cogs: sql<number>`COALESCE(SUM(${stockTransactionsTable.qty} * CAST(${stockTransactionsTable.unitCost} AS FLOAT)), 0)`,
			})
			.from(stockTransactionsTable)
			.where(
				and(
					gte(stockTransactionsTable.date, dateFrom),
					lte(stockTransactionsTable.date, dateTo),
					eq(stockTransactionsTable.type, 'usage'),
					materialId ? eq(stockTransactionsTable.materialId, materialId) : undefined,
				),
			)
			.groupBy(stockTransactionsTable.materialId)
	}

	async getAvgInventoryRows(query: BusinessInsightsRequestDto) {
		const { materialId } = query

		return this.db
			.select({
				materialId: materialLocationsTable.materialId,
				avgStock: sql<number>`COALESCE(AVG(CAST(${materialStockSnapshotsTable.currentQty} AS FLOAT)), 0)`,
			})
			.from(materialLocationsTable)
			.leftJoin(
				materialStockSnapshotsTable,
				and(
					eq(materialLocationsTable.materialId, materialStockSnapshotsTable.materialId),
					eq(materialLocationsTable.locationId, materialStockSnapshotsTable.locationId),
				),
			)
			.where(materialId ? eq(materialLocationsTable.materialId, materialId) : undefined)
			.groupBy(materialLocationsTable.materialId)
	}

	async getMaterialName(materialId: number) {
		return this.db
			.select({ name: materialsTable.name })
			.from(materialsTable)
			.where(eq(materialsTable.id, materialId))
			.limit(1)
	}
}

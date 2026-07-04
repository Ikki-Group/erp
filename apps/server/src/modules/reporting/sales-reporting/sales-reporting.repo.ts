import { and, count, eq, gte, lte, sql } from 'drizzle-orm'

import { salesOrderItemsTable, salesOrdersTable } from '@/db/schema'

import type { DbContext } from '@/infra/database'

import { SalesReportRequestDto } from './sales-reporting.contract'

export interface ISalesReportingRepo {
	readonly db: DbContext
	getRevenueOverTime(query: SalesReportRequestDto): Promise<
		Array<{ date: unknown; revenue: number; orderCount: number }>
	>
	getTopProducts(query: SalesReportRequestDto): Promise<
		Array<{
			productId: number | null
			itemName: string
			totalQuantity: number
			totalRevenue: number
		}>
	>
	getSalesByLocation(query: SalesReportRequestDto): Promise<
		Array<{ locationId: number; revenue: number; orderCount: number }>
	>
	getSalesByType(query: SalesReportRequestDto): Promise<
		Array<{ salesTypeId: number; revenue: number; orderCount: number }>
	>
}

export class SalesReportingRepo implements ISalesReportingRepo {
	constructor(readonly db: DbContext) {}

	private buildDateRangeWhere(query: SalesReportRequestDto) {
		const { dateFrom, dateTo, locationId, salesTypeId } = query
		return and(
			gte(salesOrdersTable.transactionDate, dateFrom),
			lte(salesOrdersTable.transactionDate, dateTo),
			locationId ? eq(salesOrdersTable.locationId, locationId) : undefined,
			salesTypeId ? eq(salesOrdersTable.salesTypeId, salesTypeId) : undefined,
		)
	}

	async getRevenueOverTime(query: SalesReportRequestDto) {
		const { groupBy = 'day' } = query

		let dateTrunc
		switch (groupBy) {
			case 'day':
				dateTrunc = sql`DATE(${salesOrdersTable.transactionDate})`
				break
			case 'week':
				dateTrunc = sql`DATE_TRUNC('week', ${salesOrdersTable.transactionDate})`
				break
			case 'month':
				dateTrunc = sql`DATE_TRUNC('month', ${salesOrdersTable.transactionDate})`
				break
			case 'year':
				dateTrunc = sql`DATE_TRUNC('year', ${salesOrdersTable.transactionDate})`
				break
		}

		return this.db
			.select({
				date: dateTrunc,
				revenue: sql<number>`COALESCE(SUM(${salesOrdersTable.totalAmount}), 0)`,
				orderCount: count(),
			})
			.from(salesOrdersTable)
			.where(this.buildDateRangeWhere(query))
			.groupBy(dateTrunc)
			.orderBy(dateTrunc)
	}

	async getTopProducts(query: SalesReportRequestDto) {
		return this.db
			.select({
				productId: salesOrderItemsTable.productId,
				itemName: sql<string>`COALESCE(${salesOrderItemsTable.itemName}, 'Unknown')`,
				totalQuantity: sql<number>`COALESCE(SUM(${salesOrderItemsTable.quantity}), 0)`,
				totalRevenue: sql<number>`COALESCE(SUM(${salesOrderItemsTable.subtotal}), 0)`,
			})
			.from(salesOrderItemsTable)
			.innerJoin(salesOrdersTable, eq(salesOrderItemsTable.orderId, salesOrdersTable.id))
			.where(this.buildDateRangeWhere(query))
			.groupBy(salesOrderItemsTable.productId, salesOrderItemsTable.itemName)
			.orderBy(sql`totalRevenue DESC`)
			.limit(10)
	}

	async getSalesByLocation(query: SalesReportRequestDto) {
		const { dateFrom, dateTo, salesTypeId } = query

		const where = and(
			gte(salesOrdersTable.transactionDate, dateFrom),
			lte(salesOrdersTable.transactionDate, dateTo),
			salesTypeId ? eq(salesOrdersTable.salesTypeId, salesTypeId) : undefined,
		)

		return this.db
			.select({
				locationId: salesOrdersTable.locationId,
				revenue: sql<number>`COALESCE(SUM(${salesOrdersTable.totalAmount}), 0)`,
				orderCount: count(),
			})
			.from(salesOrdersTable)
			.where(where)
			.groupBy(salesOrdersTable.locationId)
			.orderBy(sql`revenue DESC`)
	}

	async getSalesByType(query: SalesReportRequestDto) {
		const { dateFrom, dateTo, locationId } = query

		const where = and(
			gte(salesOrdersTable.transactionDate, dateFrom),
			lte(salesOrdersTable.transactionDate, dateTo),
			locationId ? eq(salesOrdersTable.locationId, locationId) : undefined,
		)

		return this.db
			.select({
				salesTypeId: salesOrdersTable.salesTypeId,
				revenue: sql<number>`COALESCE(SUM(${salesOrdersTable.totalAmount}), 0)`,
				orderCount: count(),
			})
			.from(salesOrdersTable)
			.where(where)
			.groupBy(salesOrdersTable.salesTypeId)
			.orderBy(sql`revenue DESC`)
	}
}

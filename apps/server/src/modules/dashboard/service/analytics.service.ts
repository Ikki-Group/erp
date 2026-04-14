import { record } from '@elysiajs/opentelemetry'
import { and, desc, eq, gte, lte, sql, sum } from 'drizzle-orm'
import { cache } from '@/core/cache'
import { db } from '@/db'
import { accountsTable, journalItemsTable } from '@/db/schema/finance'
import { salesOrderItemsTable, salesOrdersTable } from '@/db/schema/sales'

export interface PnLData {
	revenue: number
	cogs: number
	operatingExpenses: number
	netProfit: number
	period: { start: Date; end: Date }
}

export interface TopSalesItem {
	productId: number | null
	itemName: string
	totalQuantity: number
	totalRevenue: number
}

export class AnalyticsService {
	/**
	 * Calculates Profit & Loss for a specific period.
	 * Utilizes the General Ledger (FIN-02) as the source of truth.
	 */
	async getPnL(startDate: Date, endDate: Date): Promise<PnLData> {
		const cacheKey = `analytics.pnl.${startDate.toISOString()}.${endDate.toISOString()}`

		return cache.wrap(
			cacheKey,
			async () => {
				return record('AnalyticsService.getPnL', async () => {
					// 1. Fetch all GL items within the period
					// Mapping:
					// 4xxx: Revenue
					// 51xx: COGS
					// 5xxx (others): Operating Expenses

					const glItems = await db
						.select({
							accountCode: accountsTable.code,
							debit: journalItemsTable.debit,
							credit: journalItemsTable.credit,
						})
						.from(journalItemsTable)
						.innerJoin(accountsTable, eq(journalItemsTable.accountId, accountsTable.id))
						.innerJoin(
							db
								.select({ id: sql`id`, date: sql`date` })
								.from(sql`journal_entries`)
								.as('entries'),
							eq(journalItemsTable.journalEntryId, sql`entries.id`),
						)
						.where(and(gte(sql`entries.date`, startDate), lte(sql`entries.date`, endDate)))

					let revenue = 0
					let cogs = 0
					let operatingExpenses = 0

					for (const item of glItems) {
						const debit = Number(item.debit)
						const credit = Number(item.credit)
						const code = item.accountCode

						if (code.startsWith('4')) {
							// Revenue: Credit - Debit
							revenue += credit - debit
						} else if (code.startsWith('51')) {
							// COGS: Debit - Credit
							cogs += debit - credit
						} else if (code.startsWith('5')) {
							// Operating Expenses: Debit - Credit
							operatingExpenses += debit - credit
						}
					}

					return {
						revenue,
						cogs,
						operatingExpenses,
						netProfit: revenue - cogs - operatingExpenses,
						period: { start: startDate, end: endDate },
					}
				})
			},
			3600 * 1000,
		) // Cache for 1 hour
	}

	/**
	 * Identifies top selling products based on sales order items.
	 */
	async getTopSales(startDate: Date, endDate: Date, limit: number = 5): Promise<TopSalesItem[]> {
		const cacheKey = `analytics.top_sales.${startDate.toISOString()}.${endDate.toISOString()}.${limit}`

		return cache.wrap(
			cacheKey,
			async () => {
				return record('AnalyticsService.getTopSales', async () => {
					const result = await db
						.select({
							productId: salesOrderItemsTable.productId,
							itemName: salesOrderItemsTable.itemName,
							totalQuantity: sum(sql`CAST(${salesOrderItemsTable.quantity} AS NUMERIC)`).as(
								'total_qty',
							),
							totalRevenue: sum(sql`CAST(${salesOrderItemsTable.subtotal} AS NUMERIC)`).as(
								'total_rev',
							),
						})
						.from(salesOrderItemsTable)
						.innerJoin(salesOrdersTable, eq(salesOrderItemsTable.orderId, salesOrdersTable.id))
						.where(
							and(
								eq(salesOrdersTable.status, 'closed'),
								gte(salesOrdersTable.transactionDate, startDate),
								lte(salesOrdersTable.transactionDate, endDate),
							),
						)
						.groupBy(salesOrderItemsTable.productId, salesOrderItemsTable.itemName)
						.orderBy(desc(sql`total_rev`))
						.limit(limit)

					return result.map((r) => ({
						productId: r.productId,
						itemName: r.itemName,
						totalQuantity: Number(r.totalQuantity),
						totalRevenue: Number(r.totalRevenue),
					}))
				})
			},
			1800 * 1000,
		) // Cache for 30 mins
	}
}

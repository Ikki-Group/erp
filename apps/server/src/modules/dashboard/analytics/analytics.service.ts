import { record } from '@elysiajs/opentelemetry'
import { and, desc, eq, gte, lte, sql, sum } from 'drizzle-orm'

import type { CacheClient } from '@/core/cache'
import { type CacheProvider } from '@/core/cache'
import type { DbClient } from '@/core/database'

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

const ANALYTICS_CACHE_NAMESPACE = 'analytics'

export class AnalyticsService {
	private readonly db: DbClient
	private readonly cache: CacheProvider

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.db = db
		this.cache = cacheClient.namespace(ANALYTICS_CACHE_NAMESPACE)
	}
	async getPnL(startDate: Date, endDate: Date): Promise<PnLData> {
		return this.cache.getOrSet({
			key: `pnl.${startDate.toISOString()}.${endDate.toISOString()}`,
			ttl: '1h',
			factory: async () => {
				return record('AnalyticsService.getPnL', async () => {
					const glItems = await this.db
						.select({
							accountCode: accountsTable.code,
							debit: journalItemsTable.debit,
							credit: journalItemsTable.credit,
						})
						.from(journalItemsTable)
						.innerJoin(accountsTable, eq(journalItemsTable.accountId, accountsTable.id))
						.innerJoin(
							this.db
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
							revenue += credit - debit
						} else if (code.startsWith('51')) {
							cogs += debit - credit
						} else if (code.startsWith('5')) {
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
		})
	}

	async getTopSales(startDate: Date, endDate: Date, limit: number = 5): Promise<TopSalesItem[]> {
		return this.cache.getOrSet({
			key: `top_sales.${startDate.toISOString()}.${endDate.toISOString()}.${limit}`,
			ttl: '30m',
			factory: async () => {
				return record('AnalyticsService.getTopSales', async () => {
					const result = await this.db
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
		})
	}
}

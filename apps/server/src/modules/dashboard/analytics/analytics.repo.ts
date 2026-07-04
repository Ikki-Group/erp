import { and, desc, eq, gte, lte, sql, sum } from 'drizzle-orm'

import { accountsTable, journalEntriesTable, journalItemsTable } from '@/db/schema/finance'
import { salesOrderItemsTable, salesOrdersTable } from '@/db/schema/sales'
import type { DbContext } from '@/infra/database'

import type { PnLData, TopSalesItem } from './analytics.contract'

export interface IAnalyticsRepo {
	readonly db: DbContext
	findPnLData(startDate: Date, endDate: Date, db?: DbContext): Promise<PnLData>
	findTopSales(startDate: Date, endDate: Date, limit: number, db?: DbContext): Promise<TopSalesItem[]>
}

export class AnalyticsRepo implements IAnalyticsRepo {
	constructor(readonly db: DbContext) {}

	async findPnLData(startDate: Date, endDate: Date, db: DbContext = this.db): Promise<PnLData> {
		const glItems = await db
			.select({
				accountCode: accountsTable.code,
				debit: journalItemsTable.debit,
				credit: journalItemsTable.credit,
			})
			.from(journalItemsTable)
			.innerJoin(accountsTable, eq(journalItemsTable.accountId, accountsTable.id))
			.innerJoin(journalEntriesTable, eq(journalItemsTable.journalEntryId, journalEntriesTable.id))
			.where(and(gte(journalEntriesTable.date, startDate), lte(journalEntriesTable.date, endDate)))

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
	}

	async findTopSales(startDate: Date, endDate: Date, limit: number, db: DbContext = this.db): Promise<TopSalesItem[]> {
		const result = await db
			.select({
				productId: salesOrderItemsTable.productId,
				itemName: salesOrderItemsTable.itemName,
				totalQuantity: sum(sql`CAST(${salesOrderItemsTable.quantity} AS NUMERIC)`).as('total_qty'),
				totalRevenue: sum(sql`CAST(${salesOrderItemsTable.subtotal} AS NUMERIC)`).as('total_rev'),
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
	}
}

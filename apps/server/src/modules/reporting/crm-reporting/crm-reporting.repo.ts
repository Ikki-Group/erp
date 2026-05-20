// @ts-nocheck
import { and, eq, gte, lte, sql } from 'drizzle-orm'

import { customersTable, customerLoyaltyTransactionsTable, salesOrdersTable } from '@/db/schema'

import type { DbClient } from '@/infra/database'

import {  CrmReportRequestDto  } from './crm-reporting.dto'

export class CrmReportingRepo {
	constructor(private readonly db: DbClient) {}

	async getCustomerGrowth(query: CrmReportRequestDto) {
		const { dateFrom, dateTo, tierId, groupBy = 'day' } = query

		const where = and(
			gte(customersTable.createdAt, dateFrom),
			lte(customersTable.createdAt, dateTo),
			tierId
				? eq(customersTable.tier, tierId as 'bronze' | 'gold' | 'platinum' | 'silver')
				: undefined,
		)

		let dateTrunc
		switch (groupBy) {
			case 'day':
				dateTrunc = sql`DATE(${customersTable.createdAt})`
				break
			case 'week':
				dateTrunc = sql`DATE_TRUNC('week', ${customersTable.createdAt})`
				break
			case 'month':
				dateTrunc = sql`DATE_TRUNC('month', ${customersTable.createdAt})`
				break
			case 'year':
				dateTrunc = sql`DATE_TRUNC('year', ${customersTable.createdAt})`
				break
		}

		return this.db
			.select({
				date: dateTrunc,
				newCustomers: sql<number>`COUNT(*)`,
			})
			.from(customersTable)
			.where(where)
			.groupBy(dateTrunc)
			.orderBy(dateTrunc)
	}

	async getCustomersByTier(query: CrmReportRequestDto) {
		const { dateFrom, dateTo } = query

		const where = and(
			dateFrom ? gte(customersTable.createdAt, dateFrom) : undefined,
			dateTo ? lte(customersTable.createdAt, dateTo) : undefined,
		)

		return this.db
			.select({
				tier: customersTable.tier,
				tierName: sql<string>`${customersTable.tier}`,
				customerCount: sql<number>`COUNT(*)`,
			})
			.from(customersTable)
			.where(where)
			.groupBy(customersTable.tier)
			.orderBy(sql`customerCount DESC`)
	}

	async getTopCustomers(query: CrmReportRequestDto) {
		const { dateFrom, dateTo } = query

		const where = and(
			dateFrom ? gte(salesOrdersTable.transactionDate, dateFrom) : undefined,
			dateTo ? lte(salesOrdersTable.transactionDate, dateTo) : undefined,
		)

		return this.db
			.select({
				customerId: salesOrdersTable.customerId,
				customerName: sql<string>`COALESCE(${customersTable.name}, 'Guest')`,
				email: sql<string>`COALESCE(${customersTable.email}, '')`,
				totalSpent: sql<number>`COALESCE(SUM(${salesOrdersTable.totalAmount}), 0)`,
				orderCount: sql<number>`COUNT(*)`,
			})
			.from(salesOrdersTable)
			.leftJoin(customersTable, eq(salesOrdersTable.customerId, customersTable.id))
			.where(where)
			.groupBy(salesOrdersTable.customerId, customersTable.name, customersTable.email)
			.orderBy(sql`totalSpent DESC`)
			.limit(20)
	}

	async getLoyaltyPointsSummary(query: CrmReportRequestDto) {
		const { dateFrom, dateTo } = query

		const where = and(
			dateFrom ? gte(customerLoyaltyTransactionsTable.createdAt, dateFrom) : undefined,
			dateTo ? lte(customerLoyaltyTransactionsTable.createdAt, dateTo) : undefined,
		)

		return this.db
			.select({
				pointsIssued: sql<number>`COALESCE(SUM(CASE WHEN ${customerLoyaltyTransactionsTable.points} > 0 THEN ${customerLoyaltyTransactionsTable.points} ELSE 0 END), 0)`,
				pointsRedeemed: sql<number>`COALESCE(SUM(CASE WHEN ${customerLoyaltyTransactionsTable.points} < 0 THEN ABS(${customerLoyaltyTransactionsTable.points}) ELSE 0 END), 0)`,
			})
			.from(customerLoyaltyTransactionsTable)
			.where(where)
	}
}

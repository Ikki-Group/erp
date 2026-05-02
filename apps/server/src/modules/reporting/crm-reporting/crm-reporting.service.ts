import { record } from '@elysiajs/opentelemetry'
import { and, eq, gte, lte, sql } from 'drizzle-orm'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { customersTable, customerLoyaltyTransactionsTable, customerTiersTable, salesOrdersTable } from '@/db/schema'

import * as dto from './crm-reporting.dto'

export class CrmReportingService {
	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {}

	async getCustomerGrowth(query: dto.CrmReportRequestDto): Promise<dto.CustomerGrowthChartResponseDto> {
		return record('CrmReportingService.getCustomerGrowth', async () => {
			const { dateFrom, dateTo, locationId, tierId, groupBy = 'day' } = query

			const where = and(
				gte(customersTable.createdAt, dateFrom),
				lte(customersTable.createdAt, dateTo),
				tierId ? eq(customersTable.tierId, tierId) : undefined,
			)

			let dateTrunc: string
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

			const data = await this.db
				.select({
					date: dateTrunc,
					newCustomers: sql<number>`COUNT(*)`,
				})
				.from(customersTable)
				.where(where)
				.groupBy(dateTrunc)
				.orderBy(dateTrunc)

			const totalNewCustomers = data.reduce((sum, d) => sum + d.newCustomers, 0)
			const runningTotal: number[] = []
			let cumulative = 0

			const dataWithTotal = data.map((d) => {
				cumulative += d.newCustomers
				runningTotal.push(cumulative)
				return {
					date: d.date as string,
					newCustomers: d.newCustomers,
					totalCustomers: cumulative,
				}
			})

			return {
				chartType: 'line',
				data: dataWithTotal,
				summary: {
					total: String(totalNewCustomers),
					average: String(totalNewCustomers / (data.length || 1)),
					min: String(Math.min(...data.map((d) => d.newCustomers))),
					max: String(Math.max(...data.map((d) => d.newCustomers))),
					count: data.length,
				},
			}
		})
	}

	async getCustomersByTier(query: dto.CrmReportRequestDto): Promise<dto.CustomerByTierResponseDto> {
		return record('CrmReportingService.getCustomersByTier', async () => {
			const { dateFrom, dateTo, locationId } = query

			const where = and(
				dateFrom ? gte(customersTable.createdAt, dateFrom) : undefined,
				dateTo ? lte(customersTable.createdAt, dateTo) : undefined,
			)

			const data = await this.db
				.select({
					tierId: customersTable.tierId,
					tierName: sql<string>`COALESCE(${customerTiersTable.name}, 'No Tier')`,
					customerCount: sql<number>`COUNT(*)`,
				})
				.from(customersTable)
				.leftJoin(customerTiersTable, eq(customersTable.tierId, customerTiersTable.id))
				.where(where)
				.groupBy(customersTable.tierId, customerTiersTable.name)
				.orderBy(sql`customerCount DESC`)

			const totalCustomers = data.reduce((sum, d) => sum + d.customerCount, 0)

			return {
				chartType: 'pie',
				data: data.map((d) => ({
					tierId: d.tierId,
					tierName: d.tierName,
					customerCount: d.customerCount,
					percentage: totalCustomers > 0 ? String((d.customerCount / totalCustomers) * 100) : '0',
				})),
				summary: {
					total: String(totalCustomers),
					average: String(totalCustomers / (data.length || 1)),
					min: String(Math.min(...data.map((d) => d.customerCount))),
					max: String(Math.max(...data.map((d) => d.customerCount))),
					count: data.length,
				},
			}
		})
	}

	async getTopCustomers(query: dto.CrmReportRequestDto): Promise<dto.TopCustomersResponseDto> {
		return record('CrmReportingService.getTopCustomers', async () => {
			const { dateFrom, dateTo, locationId, tierId } = query

			const where = and(
				dateFrom ? gte(salesOrdersTable.date, dateFrom) : undefined,
				dateTo ? lte(salesOrdersTable.date, dateTo) : undefined,
				locationId ? eq(salesOrdersTable.locationId, locationId) : undefined,
			)

			const data = await this.db
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

			const totalSpent = data.reduce((sum, d) => sum + Number(d.totalSpent), 0)
			const avgSpent = data.length > 0 ? totalSpent / data.length : 0

			return {
				chartType: 'bar',
				data: data.map((d) => ({
					customerId: d.customerId,
					customerName: d.customerName,
					email: d.email,
					totalSpent: String(d.totalSpent),
					orderCount: d.orderCount,
				})),
				summary: {
					total: String(totalSpent),
					average: String(avgSpent),
					min: String(Math.min(...data.map((d) => Number(d.totalSpent)))),
					max: String(Math.max(...data.map((d) => Number(d.totalSpent)))),
					count: data.length,
				},
			}
		})
	}

	async getLoyaltyPointsSummary(query: dto.CrmReportRequestDto): Promise<dto.LoyaltyPointsResponseDto> {
		return record('CrmReportingService.getLoyaltyPointsSummary', async () => {
			const { dateFrom, dateTo, locationId } = query

			const where = and(
				dateFrom ? gte(customerLoyaltyTransactionsTable.date, dateFrom) : undefined,
				dateTo ? lte(customerLoyaltyTransactionsTable.date, dateTo) : undefined,
			)

			const data = await this.db
				.select({
					pointsIssued: sql<number>`COALESCE(SUM(CASE WHEN ${customerLoyaltyTransactionsTable.points} > 0 THEN ${customerLoyaltyTransactionsTable.points} ELSE 0 END), 0)`,
					pointsRedeemed: sql<number>`COALESCE(SUM(CASE WHEN ${customerLoyaltyTransactionsTable.points} < 0 THEN ABS(${customerLoyaltyTransactionsTable.points}) ELSE 0 END), 0)`,
				})
				.from(customerLoyaltyTransactionsTable)
				.where(where)

			const pointsIssued = data[0]?.pointsIssued || 0
			const pointsRedeemed = data[0]?.pointsRedeemed || 0
			const pointsBalance = pointsIssued - pointsRedeemed

			return {
				data: {
					totalPointsIssued: String(pointsIssued),
					totalPointsRedeemed: String(pointsRedeemed),
					pointsBalance: String(pointsBalance),
				},
			}
		})
	}

	get routes() {
		const { Elysia } = require('elysia')
		const { authPluginMacro } = require('@/core/http/auth-macro')
		const { res } = require('@/core/http/response')
		const { createSuccessResponseSchema } = require('@/core/validation')

		return new Elysia({ prefix: '/crm' })
			.use(authPluginMacro)
			.get(
				'/customer-growth',
				async ({ query }) => {
					const result = await this.getCustomerGrowth(query)
					return res.ok(result)
				},
				{
					query: dto.CrmReportRequestDto,
					response: createSuccessResponseSchema(dto.CustomerGrowthChartResponseDto),
					auth: true,
				},
			)
			.get(
				'/customers-by-tier',
				async ({ query }) => {
					const result = await this.getCustomersByTier(query)
					return res.ok(result)
				},
				{
					query: dto.CrmReportRequestDto,
					response: createSuccessResponseSchema(dto.CustomerByTierResponseDto),
					auth: true,
				},
			)
			.get(
				'/top-customers',
				async ({ query }) => {
					const result = await this.getTopCustomers(query)
					return res.ok(result)
				},
				{
					query: dto.CrmReportRequestDto,
					response: createSuccessResponseSchema(dto.TopCustomersResponseDto),
					auth: true,
				},
			)
			.get(
				'/loyalty-points',
				async ({ query }) => {
					const result = await this.getLoyaltyPointsSummary(query)
					return res.ok(result)
				},
				{
					query: dto.CrmReportRequestDto,
					response: createSuccessResponseSchema(dto.LoyaltyPointsResponseDto),
					auth: true,
				},
			)
	}
}

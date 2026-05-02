/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-type-assertion */
import { record } from '@elysiajs/opentelemetry'
import { and, eq, gte, lte, sql } from 'drizzle-orm'

import type { DbClient } from '@/core/database'

import { customersTable, customerLoyaltyTransactionsTable, salesOrdersTable } from '@/db/schema'

import * as dto from './crm-reporting.dto'

export class CrmReportingService {
	constructor(private readonly db: DbClient) {}

	async getCustomerGrowth(
		query: dto.CrmReportRequestDto,
	): Promise<dto.CustomerGrowthChartResponseDto> {
		return record('CrmReportingService.getCustomerGrowth', async () => {
			const { dateFrom, dateTo, tierId, groupBy = 'day' } = query

			const where = and(
				gte(customersTable.createdAt, dateFrom),
				lte(customersTable.createdAt, dateTo),
				tierId
					? eq(customersTable.tier, tierId as any as 'bronze' | 'gold' | 'platinum' | 'silver')
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
					date: d.date as Date,
					newCustomers: d.newCustomers,
					totalCustomers: cumulative,
				}
			})

			return {
				chartType: 'line' as const,
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
			const { dateFrom, dateTo } = query

			const where = and(
				dateFrom ? gte(customersTable.createdAt, dateFrom) : undefined,
				dateTo ? lte(customersTable.createdAt, dateTo) : undefined,
			)

			const data = await this.db
				.select({
					tier: customersTable.tier,
					tierName: sql<string>`${customersTable.tier}`,
					customerCount: sql<number>`COUNT(*)`,
				})
				.from(customersTable)
				.where(where)
				.groupBy(customersTable.tier)
				.orderBy(sql`customerCount DESC`)

			const totalCustomers = data.reduce((sum, d) => sum + d.customerCount, 0)

			return {
				chartType: 'pie' as const,
				data: data.map((d) => ({
					tierId: d.tier as any,
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
			const { dateFrom, dateTo, tierId: _tierId } = query

			const where = and(
				dateFrom ? gte(salesOrdersTable.transactionDate, dateFrom) : undefined,
				dateTo ? lte(salesOrdersTable.transactionDate, dateTo) : undefined,
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
				chartType: 'bar' as const,
				data: data
					.filter((d) => d.customerId !== null)
					.map((d) => ({
						customerId: d.customerId as number,
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

	async getLoyaltyPointsSummary(
		query: dto.CrmReportRequestDto,
	): Promise<dto.LoyaltyPointsResponseDto> {
		return record('CrmReportingService.getLoyaltyPointsSummary', async () => {
			const { dateFrom, dateTo } = query

			const where = and(
				dateFrom ? gte(customerLoyaltyTransactionsTable.createdAt, dateFrom) : undefined,
				dateTo ? lte(customerLoyaltyTransactionsTable.createdAt, dateTo) : undefined,
			)

			const data = await this.db
				.select({
					pointsIssued: sql<number>`COALESCE(SUM(CASE WHEN ${customerLoyaltyTransactionsTable.points} > 0 THEN ${customerLoyaltyTransactionsTable.points} ELSE 0 END), 0)`,
					pointsRedeemed: sql<number>`COALESCE(SUM(CASE WHEN ${customerLoyaltyTransactionsTable.points} < 0 THEN ABS(${customerLoyaltyTransactionsTable.points}) ELSE 0 END), 0)`,
				})
				.from(customerLoyaltyTransactionsTable)
				.where(where)

			const pointsIssued = data[0]?.pointsIssued ?? 0
			const pointsRedeemed = data[0]?.pointsRedeemed ?? 0
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
}

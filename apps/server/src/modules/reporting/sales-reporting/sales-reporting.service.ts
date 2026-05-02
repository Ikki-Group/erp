import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, gte, lte, sql } from 'drizzle-orm'

import type { DbClient } from '@/core/database'

import { salesOrderItemsTable, salesOrdersTable } from '@/db/schema'

import * as dto from './sales-reporting.dto'

export class SalesReportingService {
	constructor(private readonly db: DbClient) {}

	async getRevenueOverTime(
		query: dto.SalesReportRequestDto,
	): Promise<dto.SalesRevenueChartResponseDto> {
		return record('SalesReportingService.getRevenueOverTime', async () => {
			const { dateFrom, dateTo, locationId, salesTypeId, groupBy = 'day' } = query

			const where = and(
				gte(salesOrdersTable.transactionDate, dateFrom),
				lte(salesOrdersTable.transactionDate, dateTo),
				locationId ? eq(salesOrdersTable.locationId, locationId) : undefined,
				salesTypeId ? eq(salesOrdersTable.salesTypeId, salesTypeId) : undefined,
			)

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

			const data = await this.db
				.select({
					date: dateTrunc,
					revenue: sql<number>`COALESCE(SUM(${salesOrdersTable.totalAmount}), 0)`,
					orderCount: count(),
				})
				.from(salesOrdersTable)
				.where(where)
				.groupBy(dateTrunc)
				.orderBy(dateTrunc)

			const totalRevenue = data.reduce((sum, d) => sum + Number(d.revenue), 0)
			const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0

			return {
				chartType: 'line' as const,
				data: data.map((d) => ({
					date: d.date as string,
					revenue: String(d.revenue),
					orderCount: d.orderCount,
				})),
				summary: {
					total: String(totalRevenue),
					average: String(avgRevenue),
					min: String(Math.min(...data.map((d) => Number(d.revenue)))),
					max: String(Math.max(...data.map((d) => Number(d.revenue)))),
					count: data.length,
				},
			}
		})
	}

	async getTopProducts(query: dto.SalesReportRequestDto): Promise<dto.TopProductsChartResponseDto> {
		return record('SalesReportingService.getTopProducts', async () => {
			const { dateFrom, dateTo, locationId, salesTypeId } = query

			const where = and(
				gte(salesOrdersTable.transactionDate, dateFrom),
				lte(salesOrdersTable.transactionDate, dateTo),
				locationId ? eq(salesOrdersTable.locationId, locationId) : undefined,
				salesTypeId ? eq(salesOrdersTable.salesTypeId, salesTypeId) : undefined,
			)

			const data = await this.db
				.select({
					productId: salesOrderItemsTable.productId,
					itemName: sql<string>`COALESCE(${salesOrderItemsTable.itemName}, 'Unknown')`,
					totalQuantity: sql<number>`COALESCE(SUM(${salesOrderItemsTable.quantity}), 0)`,
					totalRevenue: sql<number>`COALESCE(SUM(${salesOrderItemsTable.subtotal}), 0)`,
				})
				.from(salesOrderItemsTable)
				.innerJoin(salesOrdersTable, eq(salesOrderItemsTable.orderId, salesOrdersTable.id))
				.where(where)
				.groupBy(salesOrderItemsTable.productId, salesOrderItemsTable.itemName)
				.orderBy(sql`totalRevenue DESC`)
				.limit(10)

			const totalRevenue = data.reduce((sum, d) => sum + Number(d.totalRevenue), 0)
			const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0

			return {
				chartType: 'bar' as const,
				data: data.map((d) => ({
					productId: d.productId,
					productName: d.itemName,
					totalQuantity: d.totalQuantity,
					totalRevenue: String(d.totalRevenue),
				})),
				summary: {
					total: String(totalRevenue),
					average: String(avgRevenue),
					min: String(Math.min(...data.map((d) => Number(d.totalRevenue)))),
					max: String(Math.max(...data.map((d) => Number(d.totalRevenue)))),
					count: data.length,
				},
			}
		})
	}

	async getSalesByLocation(
		query: dto.SalesReportRequestDto,
	): Promise<dto.SalesByLocationChartResponseDto> {
		return record('SalesReportingService.getSalesByLocation', async () => {
			const { dateFrom, dateTo, salesTypeId } = query

			const where = and(
				gte(salesOrdersTable.transactionDate, dateFrom),
				lte(salesOrdersTable.transactionDate, dateTo),
				salesTypeId ? eq(salesOrdersTable.salesTypeId, salesTypeId) : undefined,
			)

			const data = await this.db
				.select({
					locationId: salesOrdersTable.locationId,
					revenue: sql<number>`COALESCE(SUM(${salesOrdersTable.totalAmount}), 0)`,
					orderCount: count(),
				})
				.from(salesOrdersTable)
				.where(where)
				.groupBy(salesOrdersTable.locationId)
				.orderBy(sql`revenue DESC`)

			const totalRevenue = data.reduce((sum, d) => sum + Number(d.revenue), 0)
			const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0

			return {
				chartType: 'pie' as const,
				data: data.map((d) => ({
					locationId: d.locationId,
					revenue: String(d.revenue),
					orderCount: d.orderCount,
				})),
				summary: {
					total: String(totalRevenue),
					average: String(avgRevenue),
					min: String(Math.min(...data.map((d) => Number(d.revenue)))),
					max: String(Math.max(...data.map((d) => Number(d.revenue)))),
					count: data.length,
				},
			}
		})
	}

	async getSalesByType(query: dto.SalesReportRequestDto): Promise<dto.SalesByTypeChartResponseDto> {
		return record('SalesReportingService.getSalesByType', async () => {
			const { dateFrom, dateTo, locationId } = query

			const where = and(
				gte(salesOrdersTable.transactionDate, dateFrom),
				lte(salesOrdersTable.transactionDate, dateTo),
				locationId ? eq(salesOrdersTable.locationId, locationId) : undefined,
			)

			const data = await this.db
				.select({
					salesTypeId: salesOrdersTable.salesTypeId,
					revenue: sql<number>`COALESCE(SUM(${salesOrdersTable.totalAmount}), 0)`,
					orderCount: count(),
				})
				.from(salesOrdersTable)
				.where(where)
				.groupBy(salesOrdersTable.salesTypeId)
				.orderBy(sql`revenue DESC`)

			const totalRevenue = data.reduce((sum, d) => sum + Number(d.revenue), 0)

			return {
				chartType: 'donut' as const,
				data: data.map((d) => ({
					salesTypeId: d.salesTypeId,
					revenue: String(d.revenue),
					orderCount: d.orderCount,
					percentage: totalRevenue > 0 ? String((Number(d.revenue) / totalRevenue) * 100) : '0',
				})),
				summary: {
					total: String(totalRevenue),
					average: totalRevenue > 0 ? String(totalRevenue / data.length) : '0',
					min: String(Math.min(...data.map((d) => Number(d.revenue)))),
					max: String(Math.max(...data.map((d) => Number(d.revenue)))),
					count: data.length,
				},
			}
		})
	}

	get routes() {
		const { Elysia } = require('elysia')
		const { authPluginMacro } = require('@/core/http/auth-macro')
		const { res } = require('@/core/http/response')
		const { createSuccessResponseSchema } = require('@/core/validation')

		return new Elysia({ prefix: '/sales' })
			.use(authPluginMacro)
			.get(
				'/revenue',
				async ({ query }: { query: dto.SalesReportRequestDto }) => {
					const result = await this.getRevenueOverTime(query)
					return res.ok(result)
				},
				{
					query: dto.SalesReportRequestDto,
					response: createSuccessResponseSchema(dto.SalesRevenueChartResponseDto),
					auth: true,
				},
			)
			.get(
				'/top-products',
				async ({ query }: { query: dto.SalesReportRequestDto }) => {
					const result = await this.getTopProducts(query)
					return res.ok(result)
				},
				{
					query: dto.SalesReportRequestDto,
					response: createSuccessResponseSchema(dto.TopProductsChartResponseDto),
					auth: true,
				},
			)
			.get(
				'/by-location',
				async ({ query }: { query: dto.SalesReportRequestDto }) => {
					const result = await this.getSalesByLocation(query)
					return res.ok(result)
				},
				{
					query: dto.SalesReportRequestDto,
					response: createSuccessResponseSchema(dto.SalesByLocationChartResponseDto),
					auth: true,
				},
			)
			.get(
				'/by-type',
				async ({ query }: { query: dto.SalesReportRequestDto }) => {
					const result = await this.getSalesByType(query)
					return res.ok(result)
				},
				{
					query: dto.SalesReportRequestDto,
					response: createSuccessResponseSchema(dto.SalesByTypeChartResponseDto),
					auth: true,
				},
			)
	}
}

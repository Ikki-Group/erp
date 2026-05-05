import { record } from '@elysiajs/opentelemetry'
import { and, eq, gte, lte, sql } from 'drizzle-orm'

import type { DbClient } from '@/core/database'

import {
	locationsTable,
	materialLocationsTable,
	materialsTable,
	purchaseOrderItemsTable,
	purchaseOrdersTable,
	salesOrdersTable,
} from '@/db/schema'
import { stockTransactionsTable } from '@/db/schema/inventory'

import * as dto from './business-insights.dto'

export class BusinessInsightsService {
	constructor(private readonly db: DbClient) {}

	async getProfitability(
		query: dto.BusinessInsightsRequestDto,
	): Promise<dto.ProfitabilityResponseDto> {
		return record('BusinessInsightsService.getProfitability', async () => {
			const revenueRows = await this.db
				.select({
					date: salesOrdersTable.createdAt,
					revenue: sql<number>`COALESCE(SUM(${salesOrdersTable.totalAmount}), 0)`,
				})
				.from(salesOrdersTable)
				.where(
					and(
						gte(salesOrdersTable.createdAt, query.dateFrom),
						lte(salesOrdersTable.createdAt, query.dateTo),
						query.locationId ? eq(salesOrdersTable.locationId, query.locationId) : undefined,
					),
				)
				.groupBy(salesOrdersTable.createdAt)
				.orderBy(salesOrdersTable.createdAt)

			const cogsRows = await this.db
				.select({
					date: purchaseOrdersTable.date,
					cogs: sql<number>`COALESCE(SUM(${purchaseOrderItemsTable.totalAmount}), 0)`,
				})
				.from(purchaseOrdersTable)
				.innerJoin(
					purchaseOrderItemsTable,
					eq(purchaseOrdersTable.id, purchaseOrderItemsTable.purchaseOrderId),
				)
				.where(
					and(
						gte(purchaseOrdersTable.date, query.dateFrom),
						lte(purchaseOrdersTable.date, query.dateTo),
						query.locationId ? eq(purchaseOrdersTable.locationId, query.locationId) : undefined,
					),
				)
				.groupBy(purchaseOrdersTable.date)
				.orderBy(purchaseOrdersTable.date)

			const cogsMap = new Map(cogsRows.map((r) => [r.date.toISOString().slice(0, 10), r.cogs]))
			const data = revenueRows.map((r) => {
				const dateKey = r.date.toISOString().slice(0, 10)
				const cogs = cogsMap.get(dateKey) ?? 0
				const profit = r.revenue - cogs
				return {
					date: r.date,
					revenue: String(r.revenue),
					cogs: String(cogs),
					expenses: '0',
					profit: String(profit),
					margin: r.revenue > 0 ? Math.round((profit / r.revenue) * 1000) / 10 : 0,
				}
			})

			const totalRevenue = data.reduce((s, d) => s + Number(d.revenue), 0)
			const totalProfit = data.reduce((s, d) => s + Number(d.profit), 0)
			return {
				chartType: 'bar' as const,
				data,
				summary: {
					total: String(totalRevenue),
					average: String(data.length > 0 ? totalRevenue / data.length : 0),
					min: String(Math.min(...data.map((d) => Number(d.profit)), 0)),
					max: String(Math.max(...data.map((d) => Number(d.profit)), 0)),
					count: data.length,
				},
			}
		})
	}

	async getLocationPerformance(
		query: dto.BusinessInsightsRequestDto,
	): Promise<dto.LocationPerformanceResponseDto> {
		return record('BusinessInsightsService.getLocationPerformance', async () => {
			const data = await this.db
				.select({
					locationId: locationsTable.id,
					locationName: locationsTable.name,
					totalSales: sql<number>`COUNT(${salesOrdersTable.id})`,
					totalRevenue: sql<number>`COALESCE(SUM(${salesOrdersTable.totalAmount}), 0)`,
					totalCost: sql<number>`COALESCE(SUM(${purchaseOrderItemsTable.totalAmount}), 0)`,
				})
				.from(locationsTable)
				.leftJoin(
					salesOrdersTable,
					and(
						eq(locationsTable.id, salesOrdersTable.locationId),
						gte(salesOrdersTable.createdAt, query.dateFrom),
						lte(salesOrdersTable.createdAt, query.dateTo),
					),
				)
				.leftJoin(
					purchaseOrdersTable,
					and(
						eq(locationsTable.id, purchaseOrdersTable.locationId),
						gte(purchaseOrdersTable.date, query.dateFrom),
						lte(purchaseOrdersTable.date, query.dateTo),
					),
				)
				.leftJoin(
					purchaseOrderItemsTable,
					eq(purchaseOrdersTable.id, purchaseOrderItemsTable.purchaseOrderId),
				)
				.where(query.locationId ? eq(locationsTable.id, query.locationId) : undefined)
				.groupBy(locationsTable.id)
				.orderBy(sql`totalRevenue DESC`)

			const result = data.map((d) => {
				const profit = Number(d.totalRevenue) - Number(d.totalCost)
				return {
					...d,
					totalRevenue: String(d.totalRevenue),
					totalCost: String(d.totalCost),
					profit: String(profit),
					avgOrderValue: String(d.totalSales > 0 ? Number(d.totalRevenue) / d.totalSales : 0),
				}
			})

			const totalRevenue = result.reduce((s, d) => s + Number(d.totalRevenue), 0)
			return {
				chartType: 'bar' as const,
				data: result,
				summary: {
					total: String(totalRevenue),
					average: String(result.length > 0 ? totalRevenue / result.length : 0),
					min: String(Math.min(...result.map((d) => Number(d.totalRevenue)), 0)),
					max: String(Math.max(...result.map((d) => Number(d.totalRevenue)), 0)),
					count: result.length,
				},
			}
		})
	}

	async getInventoryTurnover(
		query: dto.BusinessInsightsRequestDto,
	): Promise<dto.InventoryTurnoverResponseDto> {
		return record('BusinessInsightsService.getInventoryTurnover', async () => {
			const cogsRows = await this.db
				.select({
					materialId: stockTransactionsTable.materialId,
					cogs: sql<number>`COALESCE(SUM(${stockTransactionsTable.quantity} * CAST(${stockTransactionsTable.unitCost} AS FLOAT)), 0)`,
				})
				.from(stockTransactionsTable)
				.where(
					and(
						gte(stockTransactionsTable.date, query.dateFrom),
						lte(stockTransactionsTable.date, query.dateTo),
						eq(stockTransactionsTable.type, 'usage' as any),
						query.materialId ? eq(stockTransactionsTable.materialId, query.materialId) : undefined,
					),
				)
				.groupBy(stockTransactionsTable.materialId)

			const avgInvRows = await this.db
				.select({
					materialId: materialLocationsTable.materialId,
					avgStock: sql<number>`COALESCE(AVG(${materialLocationsTable.currentStock}), 0)`,
				})
				.from(materialLocationsTable)
				.where(
					query.materialId ? eq(materialLocationsTable.materialId, query.materialId) : undefined,
				)
				.groupBy(materialLocationsTable.materialId)

			const avgInvMap = new Map(avgInvRows.map((r) => [r.materialId, r.avgStock]))

			const data = await Promise.all(
				cogsRows.map(async (row) => {
					const material = await this.db
						.select({ name: materialsTable.name })
						.from(materialsTable)
						.where(eq(materialsTable.id, row.materialId))
						.limit(1)
					const avgInv = avgInvMap.get(row.materialId) ?? 0
					const turnover = avgInv > 0 ? Math.round((row.cogs / avgInv) * 100) / 100 : 0
					const days = turnover > 0 ? Math.round(365 / turnover) : 0
					return {
						materialId: row.materialId,
						materialName: material[0]?.name ?? 'Unknown',
						cogs: String(row.cogs),
						avgInventory: String(avgInv),
						turnoverRatio: turnover,
						daysInInventory: days,
					}
				}),
			)

			return {
				chartType: 'bar' as const,
				data,
				summary: {
					total: String(data.reduce((s, d) => s + d.turnoverRatio, 0)),
					average: String(
						data.length > 0 ? data.reduce((s, d) => s + d.turnoverRatio, 0) / data.length : 0,
					),
					min: String(Math.min(...data.map((d) => d.turnoverRatio), 0)),
					max: String(Math.max(...data.map((d) => d.turnoverRatio), 0)),
					count: data.length,
				},
			}
		})
	}
}

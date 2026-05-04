/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { record } from '@elysiajs/opentelemetry'
import { and, eq, gte, isNull, lte, or, sql } from 'drizzle-orm'

import type { DbClient } from '@/core/database'

import { stockTransactionsTable } from '@/db/schema/inventory'
import { materialLocationsTable, materialsTable, uomsTable } from '@/db/schema/material'

import * as dto from './inventory-reporting.dto'

export class InventoryReportingService {
	constructor(private readonly db: DbClient) {}

	async getStockLevels(query: dto.InventoryReportRequestDto): Promise<dto.StockLevelResponseDto> {
		return record('InventoryReportingService.getStockLevels', async () => {
			const conditions = [
				isNull(materialLocationsTable.deletedAt),
				isNull(materialsTable.deletedAt),
				query.locationId ? eq(materialLocationsTable.locationId, query.locationId) : undefined,
				query.productId ? eq(materialLocationsTable.materialId, query.productId) : undefined,
			]

			const whereClause = and(...conditions.filter(Boolean))

			const data = await this.db
				.select({
					productId: materialLocationsTable.materialId,
					productName: materialsTable.name,
					sku: materialsTable.sku,
					currentStock: sql<number>`CAST(${materialLocationsTable.currentQty} AS FLOAT)`,
					reorderLevel: sql<number>`CAST(${materialLocationsTable.reorderPoint} AS FLOAT)`,
					unit: sql<string>`COALESCE(${uomsTable.code}, 'unit')`,
				})
				.from(materialLocationsTable)
				.innerJoin(materialsTable, eq(materialLocationsTable.materialId, materialsTable.id))
				.leftJoin(uomsTable, eq(materialsTable.baseUomId, uomsTable.id))
				.where(whereClause)
				.orderBy(materialsTable.name)

			const summary = await this.db
				.select({
					total: sql<number>`COALESCE(SUM(CAST(${materialLocationsTable.currentQty} AS FLOAT)), 0)`,
					count: sql<number>`cast(count(*) as int)`,
				})
				.from(materialLocationsTable)
				.innerJoin(materialsTable, eq(materialLocationsTable.materialId, materialsTable.id))
				.where(whereClause)

			const s = summary[0]

			return {
				data,
				summary: {
					total: String(s?.total ?? 0),
					average: String((s?.total ?? 0) / (s?.count || 1)),
					min: '0',
					max: '0',
					count: s?.count ?? 0,
				},
			}
		})
	}

	async getStockValue(query: dto.InventoryReportRequestDto): Promise<dto.StockValueResponseDto> {
		return record('InventoryReportingService.getStockValue', async () => {
			const conditions = [
				isNull(materialLocationsTable.deletedAt),
				isNull(materialsTable.deletedAt),
				query.locationId ? eq(materialLocationsTable.locationId, query.locationId) : undefined,
				query.productId ? eq(materialLocationsTable.materialId, query.productId) : undefined,
			]

			const whereClause = and(...conditions.filter(Boolean))

			const rows = await this.db
				.select({
					productId: materialLocationsTable.materialId,
					productName: materialsTable.name,
					sku: materialsTable.sku,
					quantity: sql<number>`CAST(${materialLocationsTable.currentQty} AS FLOAT)`,
					unitCost: sql<number>`CAST(${materialLocationsTable.currentAvgCost} AS FLOAT)`,
					totalValue: sql<number>`CAST(${materialLocationsTable.currentValue} AS FLOAT)`,
				})
				.from(materialLocationsTable)
				.innerJoin(materialsTable, eq(materialLocationsTable.materialId, materialsTable.id))
				.where(whereClause)
				.orderBy(sql`${materialLocationsTable.currentValue} DESC`)

			const data = rows.map((r) => ({
				...r,
				unitCost: String(r.unitCost),
				totalValue: String(r.totalValue),
			}))

			const summary = await this.db
				.select({
					total: sql<number>`COALESCE(SUM(CAST(${materialLocationsTable.currentValue} AS FLOAT)), 0)`,
					count: sql<number>`cast(count(*) as int)`,
				})
				.from(materialLocationsTable)
				.innerJoin(materialsTable, eq(materialLocationsTable.materialId, materialsTable.id))
				.where(whereClause)

			const s = summary[0]

			return {
				chartType: 'bar' as const,
				data,
				summary: {
					total: String(s?.total ?? 0),
					average: String((s?.total ?? 0) / (s?.count || 1)),
					min: '0',
					max: '0',
					count: s?.count ?? 0,
				},
			}
		})
	}

	async getLowStockItems(query: dto.InventoryReportRequestDto): Promise<dto.LowStockResponseDto> {
		return record('InventoryReportingService.getLowStockItems', async () => {
			const conditions = [
				isNull(materialLocationsTable.deletedAt),
				isNull(materialsTable.deletedAt),
				query.locationId ? eq(materialLocationsTable.locationId, query.locationId) : undefined,
				query.productId ? eq(materialLocationsTable.materialId, query.productId) : undefined,
				or(
					lte(materialLocationsTable.currentQty, materialLocationsTable.minStock),
					lte(materialLocationsTable.currentQty, materialLocationsTable.reorderPoint),
				),
			]

			const whereClause = and(...conditions.filter(Boolean))

			const data = await this.db
				.select({
					productId: materialLocationsTable.materialId,
					productName: materialsTable.name,
					sku: materialsTable.sku,
					currentStock: sql<number>`CAST(${materialLocationsTable.currentQty} AS FLOAT)`,
					reorderLevel: sql<number>`CAST(${materialLocationsTable.reorderPoint} AS FLOAT)`,
					shortage: sql<number>`CAST(${materialLocationsTable.reorderPoint} AS FLOAT) - CAST(${materialLocationsTable.currentQty} AS FLOAT)`,
				})
				.from(materialLocationsTable)
				.innerJoin(materialsTable, eq(materialLocationsTable.materialId, materialsTable.id))
				.where(whereClause)
				.orderBy(sql`${materialLocationsTable.currentQty}`)

			const summary = await this.db
				.select({
					count: sql<number>`cast(count(*) as int)`,
				})
				.from(materialLocationsTable)
				.innerJoin(materialsTable, eq(materialLocationsTable.materialId, materialsTable.id))
				.where(whereClause)

			const s = summary[0]

			return {
				data,
				summary: {
					total: String(s?.count ?? 0),
					average: '0',
					min: '0',
					max: '0',
					count: s?.count ?? 0,
				},
			}
		})
	}

	async getInventoryMovements(
		query: dto.InventoryReportRequestDto,
	): Promise<dto.InventoryMovementChartResponseDto> {
		return record('InventoryReportingService.getInventoryMovements', async () => {
			const conditions = [
				isNull(stockTransactionsTable.deletedAt),
				gte(stockTransactionsTable.date, query.dateFrom),
				lte(stockTransactionsTable.date, query.dateTo),
				query.locationId ? eq(stockTransactionsTable.locationId, query.locationId) : undefined,
				query.productId ? eq(stockTransactionsTable.materialId, query.productId) : undefined,
			]

			const whereClause = and(...conditions.filter(Boolean))

			const movements = await this.db
				.select({
					date: stockTransactionsTable.date,
					quantityIn: sql<number>`COALESCE(SUM(CASE WHEN ${stockTransactionsTable.type} IN ('purchase', 'transfer_in', 'production_in') THEN CAST(${stockTransactionsTable.qty} AS FLOAT) ELSE 0 END), 0)`,
					quantityOut: sql<number>`COALESCE(SUM(CASE WHEN ${stockTransactionsTable.type} IN ('sell', 'transfer_out', 'usage', 'production_out') THEN CAST(${stockTransactionsTable.qty} AS FLOAT) ELSE 0 END), 0)`,
					netAdjustment: sql<number>`COALESCE(SUM(CASE WHEN ${stockTransactionsTable.type} = 'adjustment' THEN CAST(${stockTransactionsTable.qty} AS FLOAT) ELSE 0 END), 0)`,
				})
				.from(stockTransactionsTable)
				.where(whereClause)
				.groupBy(stockTransactionsTable.date)
				.orderBy(stockTransactionsTable.date)

			const data = movements.map((m) => ({
				date: m.date,
				quantityIn: Math.round((m.quantityIn + Math.max(m.netAdjustment, 0)) * 100) / 100,
				quantityOut:
					Math.round((m.quantityOut + Math.abs(Math.min(m.netAdjustment, 0))) * 100) / 100,
				netMovement: Math.round((m.quantityIn - m.quantityOut + m.netAdjustment) * 100) / 100,
			}))

			const totalIn = data.reduce((sum, d) => sum + d.quantityIn, 0)
			const totalOut = data.reduce((sum, d) => sum + d.quantityOut, 0)
			const count = data.length

			return {
				chartType: 'area' as const,
				data,
				summary: {
					total: String(totalIn + totalOut),
					average: String(count > 0 ? totalIn / count : 0),
					min: '0',
					max: '0',
					count,
				},
			}
		})
	}
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { record } from '@elysiajs/opentelemetry'
import { and, eq, gte, isNull, lte, or, sql } from 'drizzle-orm'

import type { DbClient } from '@/core/database'

import {
	stockTransactionsTable,
	stockAdjustmentsTable,
	stockAdjustmentItemsTable,
} from '@/db/schema/inventory'
import { locationsTable } from '@/db/schema/location'
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

	async getOpnameReport(
		query: dto.InventoryReportRequestDto,
	): Promise<dto.OpnameVarianceResponseDto> {
		return record('InventoryReportingService.getOpnameReport', async () => {
			const data = await this.db
				.select({
					materialId: materialsTable.id,
					materialName: materialsTable.name,
					locationId: locationsTable.id,
					locationName: locationsTable.name,
					expectedQty: sql<number>`COALESCE(SUM(${stockAdjustmentItemsTable.qtyDiff}) + SUM(${stockAdjustmentItemsTable.qtyDiff}), 0)`,
					actualQty: sql<number>`COALESCE(SUM(${stockAdjustmentItemsTable.qtyDiff}), 0)`,
					variance: sql<number>`COALESCE(SUM(${stockAdjustmentItemsTable.qtyDiff}), 0)`,
					varianceCost: sql<number>`COALESCE(SUM(${stockAdjustmentItemsTable.qtyDiff} * CAST(${stockAdjustmentItemsTable.unitCost} AS FLOAT)), 0)`,
					adjustmentType: stockAdjustmentsTable.type,
					date: stockAdjustmentsTable.adjustmentDate,
				})
				.from(stockAdjustmentsTable)
				.innerJoin(
					stockAdjustmentItemsTable,
					eq(stockAdjustmentsTable.id, stockAdjustmentItemsTable.adjustmentId),
				)
				.innerJoin(materialsTable, eq(stockAdjustmentItemsTable.materialId, materialsTable.id))
				.innerJoin(locationsTable, eq(stockAdjustmentsTable.locationId, locationsTable.id))
				.where(
					and(
						eq(stockAdjustmentsTable.type, 'opname'),
						gte(stockAdjustmentsTable.adjustmentDate, query.dateFrom),
						lte(stockAdjustmentsTable.adjustmentDate, query.dateTo),
						query.locationId ? eq(stockAdjustmentsTable.locationId, query.locationId) : undefined,
						query.productId ? eq(stockAdjustmentItemsTable.materialId, query.productId) : undefined,
					),
				)
				.groupBy(
					materialsTable.id,
					locationsTable.id,
					stockAdjustmentsTable.type,
					stockAdjustmentsTable.adjustmentDate,
				)
				.orderBy(stockAdjustmentsTable.adjustmentDate)

			const totalVariance = data.reduce((s, d) => s + d.variance, 0)
			return {
				chartType: 'bar' as const,
				data: data.map((d) => ({
					...d,
					expectedQty: Math.abs(d.expectedQty),
					actualQty: Math.abs(d.actualQty),
					variance: d.variance,
					varianceCost: String(d.varianceCost),
				})),
				summary: {
					total: String(totalVariance),
					average: String(data.length > 0 ? totalVariance / data.length : 0),
					min: String(Math.min(...data.map((d) => d.variance), 0)),
					max: String(Math.max(...data.map((d) => d.variance), 0)),
					count: data.length,
				},
			}
		})
	}

	async getConsumptionReport(
		query: dto.InventoryReportRequestDto,
	): Promise<dto.ConsumptionResponseDto> {
		return record('InventoryReportingService.getConsumptionReport', async () => {
			const data = await this.db
				.select({
					materialId: materialsTable.id,
					materialName: materialsTable.name,
					materialType: materialsTable.type,
					locationId: locationsTable.id,
					locationName: locationsTable.name,
					quantity: sql<number>`COALESCE(SUM(${stockTransactionsTable.qty}), 0)`,
					unit: uomsTable.code,
					cost: sql<number>`COALESCE(SUM(${stockTransactionsTable.qty} * CAST(${stockTransactionsTable.unitCost} AS FLOAT)), 0)`,
					date: stockTransactionsTable.date,
				})
				.from(stockTransactionsTable)
				.innerJoin(materialsTable, eq(stockTransactionsTable.materialId, materialsTable.id))
				.innerJoin(locationsTable, eq(stockTransactionsTable.locationId, locationsTable.id))
				.leftJoin(uomsTable, eq(materialsTable.baseUomId, uomsTable.id))
				.where(
					and(
						gte(stockTransactionsTable.date, query.dateFrom),
						lte(stockTransactionsTable.date, query.dateTo),
						eq(stockTransactionsTable.type, 'usage' as any),
						query.locationId ? eq(stockTransactionsTable.locationId, query.locationId) : undefined,
						query.productId ? eq(stockTransactionsTable.materialId, query.productId) : undefined,
					),
				)
				.groupBy(materialsTable.id, locationsTable.id, uomsTable.code, stockTransactionsTable.date)
				.orderBy(stockTransactionsTable.date)

			const totalQty = data.reduce((s, d) => s + d.quantity, 0)
			return {
				chartType: 'bar' as const,
				data: data.map((d) => ({
					...d,
					quantity: d.quantity,
					cost: String(d.cost),
					unit: d.unit ?? '',
				})),
				summary: {
					total: String(totalQty),
					average: String(data.length > 0 ? totalQty / data.length : 0),
					min: String(Math.min(...data.map((d) => d.quantity), 0)),
					max: String(Math.max(...data.map((d) => d.quantity), 0)),
					count: data.length,
				},
			}
		})
	}

	async getWasteReport(query: dto.InventoryReportRequestDto): Promise<dto.WasteResponseDto> {
		return record('InventoryReportingService.getWasteReport', async () => {
			const data = await this.db
				.select({
					materialId: materialsTable.id,
					materialName: materialsTable.name,
					locationId: locationsTable.id,
					locationName: locationsTable.name,
					quantity: sql<number>`COALESCE(SUM(ABS(${stockAdjustmentItemsTable.qtyDiff})), 0)`,
					unit: uomsTable.code,
					cost: sql<number>`COALESCE(SUM(ABS(${stockAdjustmentItemsTable.qtyDiff}) * CAST(${stockAdjustmentItemsTable.unitCost} AS FLOAT)), 0)`,
					reason: stockAdjustmentsTable.reason,
					date: stockAdjustmentsTable.adjustmentDate,
				})
				.from(stockAdjustmentsTable)
				.innerJoin(
					stockAdjustmentItemsTable,
					eq(stockAdjustmentsTable.id, stockAdjustmentItemsTable.adjustmentId),
				)
				.innerJoin(materialsTable, eq(stockAdjustmentItemsTable.materialId, materialsTable.id))
				.innerJoin(locationsTable, eq(stockAdjustmentsTable.locationId, locationsTable.id))
				.leftJoin(uomsTable, eq(materialsTable.baseUomId, uomsTable.id))
				.where(
					and(
						eq(stockAdjustmentsTable.type, 'waste'),
						gte(stockAdjustmentsTable.adjustmentDate, query.dateFrom),
						lte(stockAdjustmentsTable.adjustmentDate, query.dateTo),
						query.locationId ? eq(stockAdjustmentsTable.locationId, query.locationId) : undefined,
						query.productId ? eq(stockAdjustmentItemsTable.materialId, query.productId) : undefined,
					),
				)
				.groupBy(
					materialsTable.id,
					locationsTable.id,
					uomsTable.code,
					stockAdjustmentsTable.reason,
					stockAdjustmentsTable.adjustmentDate,
				)
				.orderBy(stockAdjustmentsTable.adjustmentDate)

			const totalQty = data.reduce((s, d) => s + d.quantity, 0)
			return {
				chartType: 'bar' as const,
				data: data.map((d) => ({
					...d,
					quantity: d.quantity,
					cost: String(d.cost),
					unit: d.unit ?? '',
					reason: d.reason ?? undefined,
				})),
				summary: {
					total: String(totalQty),
					average: String(data.length > 0 ? totalQty / data.length : 0),
					min: String(Math.min(...data.map((d) => d.quantity), 0)),
					max: String(Math.max(...data.map((d) => d.quantity), 0)),
					count: data.length,
				},
			}
		})
	}
}

import { record } from '@elysiajs/opentelemetry'
import { and, eq, gte, lte, sql } from 'drizzle-orm'

import type { DbClient } from '@/core/database'

import { inventoryBatchesTable, inventoryMovementsTable, productsTable } from '@/db/schema'

import * as dto from './inventory-reporting.dto'

export class InventoryReportingService {
	constructor(private readonly db: DbClient) {}

	async getStockLevels(query: dto.InventoryReportRequestDto): Promise<dto.StockLevelResponseDto> {
		return record('InventoryReportingService.getStockLevels', async () => {
			const { locationId, productId } = query

			const where = and(
				locationId ? eq(inventoryBatchesTable.locationId, locationId) : undefined,
				productId ? eq(inventoryBatchesTable.productId, productId) : undefined,
			)

			const data = await this.db
				.select({
					productId: productsTable.id,
					productName: productsTable.name,
					sku: productsTable.sku,
					currentStock: sql<number>`COALESCE(SUM(${inventoryBatchesTable.quantity}), 0)`,
				})
				.from(inventoryBatchesTable)
				.innerJoin(productsTable, eq(inventoryBatchesTable.productId, productsTable.id))
				.where(where)
				.groupBy(productsTable.id, productsTable.name, productsTable.sku)
				.orderBy(sql`currentStock ASC`)

			const totalStock = data.reduce((sum, d) => sum + d.currentStock, 0)
			const avgStock = data.length > 0 ? totalStock / data.length : 0
			const lowStockCount = data.filter((d) => d.currentStock <= 0).length

			return {
				data: data.map((d) => ({
					productId: d.productId,
					productName: d.productName,
					sku: d.sku,
					currentStock: d.currentStock,
					reorderLevel: 0,
					unit: '',
				})),
				summary: {
					total: String(totalStock),
					average: String(avgStock),
					min: String(Math.min(...data.map((d) => d.currentStock))),
					max: String(Math.max(...data.map((d) => d.currentStock))),
					count: data.length,
				},
			}
		})
	}

	async getInventoryMovements(
		query: dto.InventoryReportRequestDto,
	): Promise<dto.InventoryMovementChartResponseDto> {
		return record('InventoryReportingService.getInventoryMovements', async () => {
			const { dateFrom, dateTo, locationId, productId, groupBy = 'day' } = query

			const where = and(
				gte(inventoryMovementsTable.date, dateFrom),
				lte(inventoryMovementsTable.date, dateTo),
				locationId ? eq(inventoryMovementsTable.locationId, locationId) : undefined,
				productId ? eq(inventoryMovementsTable.productId, productId) : undefined,
			)

			let dateTrunc
			switch (groupBy) {
				case 'day':
					dateTrunc = sql`DATE(${inventoryMovementsTable.date})`
					break
				case 'week':
					dateTrunc = sql`DATE_TRUNC('week', ${inventoryMovementsTable.date})`
					break
				case 'month':
					dateTrunc = sql`DATE_TRUNC('month', ${inventoryMovementsTable.date})`
					break
				case 'year':
					dateTrunc = sql`DATE_TRUNC('year', ${inventoryMovementsTable.date})`
					break
			}

			const data = await this.db
				.select({
					date: dateTrunc,
					quantityIn: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovementsTable.quantity} > 0 THEN ${inventoryMovementsTable.quantity} ELSE 0 END), 0)`,
					quantityOut: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovementsTable.quantity} < 0 THEN ABS(${inventoryMovementsTable.quantity}) ELSE 0 END), 0)`,
				})
				.from(inventoryMovementsTable)
				.where(where)
				.groupBy(dateTrunc)
				.orderBy(dateTrunc)

			const totalIn = data.reduce((sum, d) => sum + d.quantityIn, 0)
			const totalOut = data.reduce((sum, d) => sum + d.quantityOut, 0)

			return {
				chartType: 'line',
				data: data.map((d) => ({
					date: d.date as string,
					quantityIn: d.quantityIn,
					quantityOut: d.quantityOut,
					netMovement: d.quantityIn - d.quantityOut,
				})),
				summary: {
					total: String(totalIn - totalOut),
					average: String((totalIn - totalOut) / (data.length || 1)),
					min: String(Math.min(...data.map((d) => d.quantityIn - d.quantityOut))),
					max: String(Math.max(...data.map((d) => d.quantityIn - d.quantityOut))),
					count: data.length,
				},
			}
		})
	}

	async getStockValue(query: dto.InventoryReportRequestDto): Promise<dto.StockValueResponseDto> {
		return record('InventoryReportingService.getStockValue', async () => {
			const { locationId, productId } = query

			const where = and(
				locationId ? eq(inventoryBatchesTable.locationId, locationId) : undefined,
				productId ? eq(inventoryBatchesTable.productId, productId) : undefined,
			)

			const data = await this.db
				.select({
					productId: productsTable.id,
					productName: productsTable.name,
					sku: productsTable.sku,
					quantity: sql<number>`COALESCE(SUM(${inventoryBatchesTable.quantity}), 0)`,
				})
				.from(inventoryBatchesTable)
				.innerJoin(productsTable, eq(inventoryBatchesTable.productId, productsTable.id))
				.where(where)
				.groupBy(productsTable.id, productsTable.name, productsTable.sku)
				.orderBy(sql`quantity DESC`)
				.limit(20)

			const dataWithValue = data.map((d) => ({
				productId: d.productId,
				productName: d.productName,
				sku: d.sku,
				quantity: d.quantity,
				unitCost: '0',
				totalValue: '0',
			}))

			const totalValue = dataWithValue.reduce((sum, d) => sum + Number(d.totalValue), 0)
			const avgValue = data.length > 0 ? totalValue / data.length : 0

			return {
				chartType: 'bar' as const,
				data: dataWithValue,
				summary: {
					total: String(totalValue),
					average: String(avgValue),
					min: String(Math.min(...dataWithValue.map((d) => Number(d.totalValue)))),
					max: String(Math.max(...dataWithValue.map((d) => Number(d.totalValue)))),
					count: data.length,
				},
			}
		})
	}

	async getLowStockItems(query: dto.InventoryReportRequestDto): Promise<dto.LowStockResponseDto> {
		return record('InventoryReportingService.getLowStockItems', async () => {
			const { locationId } = query

			const where = and(locationId ? eq(inventoryBatchesTable.locationId, locationId) : undefined)

			const data = await this.db
				.select({
					productId: productsTable.id,
					productName: productsTable.name,
					sku: productsTable.sku,
					currentStock: sql<number>`COALESCE(SUM(${inventoryBatchesTable.quantity}), 0)`,
					reorderLevel: productsTable.reorderLevel,
				})
				.from(inventoryBatchesTable)
				.innerJoin(productsTable, eq(inventoryBatchesTable.productId, productsTable.id))
				.where(where)
				.groupBy(
					productsTable.id,
					productsTable.name,
					productsTable.sku,
					productsTable.reorderLevel,
				)
				.having(
					sql`COALESCE(SUM(${inventoryBatchesTable.quantity}), 0) <= ${productsTable.reorderLevel}`,
				)
				.orderBy(sql`currentStock ASC`)

			const dataWithShortage = data.map((d) => ({
				productId: d.productId,
				productName: d.productName,
				sku: d.sku,
				currentStock: d.currentStock,
				reorderLevel: d.reorderLevel,
				shortage: Math.max(0, d.reorderLevel - d.currentStock),
			}))

			return {
				data: dataWithShortage,
				summary: {
					total: String(dataWithShortage.reduce((sum, d) => sum + d.shortage, 0)),
					average:
						dataWithShortage.length > 0
							? String(
									dataWithShortage.reduce((sum, d) => sum + d.shortage, 0) /
										dataWithShortage.length,
								)
							: '0',
					min: String(Math.min(...dataWithShortage.map((d) => d.shortage))),
					max: String(Math.max(...dataWithShortage.map((d) => d.shortage))),
					count: dataWithShortage.length,
				},
			}
		})
	}

	get routes() {
		const { Elysia } = require('elysia')
		const { authPluginMacro } = require('@/core/http/auth-macro')
		const { res } = require('@/core/http/response')
		const { createSuccessResponseSchema } = require('@/core/validation')

		return new Elysia({ prefix: '/inventory' })
			.use(authPluginMacro)
			.get(
				'/stock-levels',
				async ({ query }: { query: dto.InventoryReportRequestDto }) => {
					const result = await this.getStockLevels(query)
					return res.ok(result)
				},
				{
					query: dto.InventoryReportRequestDto,
					response: createSuccessResponseSchema(dto.StockLevelResponseDto),
					auth: true,
				},
			)
			.get(
				'/movements',
				async ({ query }: { query: dto.InventoryReportRequestDto }) => {
					const result = await this.getInventoryMovements(query)
					return res.ok(result)
				},
				{
					query: dto.InventoryReportRequestDto,
					response: createSuccessResponseSchema(dto.InventoryMovementChartResponseDto),
					auth: true,
				},
			)
			.get(
				'/stock-value',
				async ({ query }: { query: dto.InventoryReportRequestDto }) => {
					const result = await this.getStockValue(query)
					return res.ok(result)
				},
				{
					query: dto.InventoryReportRequestDto,
					response: createSuccessResponseSchema(dto.StockValueResponseDto),
					auth: true,
				},
			)
			.get(
				'/low-stock',
				async ({ query }: { query: dto.InventoryReportRequestDto }) => {
					const result = await this.getLowStockItems(query)
					return res.ok(result)
				},
				{
					query: dto.InventoryReportRequestDto,
					response: createSuccessResponseSchema(dto.LowStockResponseDto),
					auth: true,
				},
			)
	}
}

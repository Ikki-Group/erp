import { record } from '@elysiajs/opentelemetry'
import { and, eq, gte, lte, sql } from 'drizzle-orm'

import type { DbClient } from '@/core/database'

import {
	locationsTable,
	materialsTable,
	purchaseOrderItemsTable,
	purchaseOrdersTable,
	stockTransferItemsTable,
	stockTransfersTable,
	suppliersTable,
} from '@/db/schema'

import * as dto from './procurement-reporting.dto'

export class ProcurementReportingService {
	constructor(private readonly db: DbClient) {}

	async getPurchasesReport(
		query: dto.ProcurementReportRequestDto,
	): Promise<dto.PurchaseReportResponseDto> {
		return record('ProcurementReportingService.getPurchasesReport', async () => {
			const data = await this.db
				.select({
					purchaseOrderId: purchaseOrdersTable.id,
					date: purchaseOrdersTable.transactionDate,
					supplierId: suppliersTable.id,
					supplierName: suppliersTable.name,
					materialId: materialsTable.id,
					materialName: materialsTable.name,
					quantity: purchaseOrderItemsTable.quantity,
					unitPrice: purchaseOrderItemsTable.unitPrice,
					subtotal: purchaseOrderItemsTable.subtotal,
					status: purchaseOrdersTable.status,
				})
				.from(purchaseOrdersTable)
				.innerJoin(
					purchaseOrderItemsTable,
					eq(purchaseOrdersTable.id, purchaseOrderItemsTable.orderId),
				)
				.innerJoin(suppliersTable, eq(purchaseOrdersTable.supplierId, suppliersTable.id))
				.innerJoin(materialsTable, eq(purchaseOrderItemsTable.materialId, materialsTable.id))
				.where(
					and(
						gte(purchaseOrdersTable.transactionDate, query.dateFrom),
						lte(purchaseOrdersTable.transactionDate, query.dateTo),
						query.locationId ? eq(purchaseOrdersTable.locationId, query.locationId) : undefined,
						query.supplierId ? eq(purchaseOrdersTable.supplierId, query.supplierId) : undefined,
					),
				)
				.orderBy(purchaseOrdersTable.transactionDate)

			const totalAmount = data.reduce((s, d) => s + Number(d.subtotal), 0)
			// const totalQty = data.reduce((s, d) => s + Number(d.quantity), 0)
			return {
				chartType: 'bar' as const,
				data: data.map((d) => ({
					...d,
					quantity: Number(d.quantity),
					unitPrice: String(d.unitPrice),
					subtotal: String(d.subtotal),
				})),
				summary: {
					total: String(totalAmount),
					average: String(data.length > 0 ? totalAmount / data.length : 0),
					min: String(Math.min(...data.map((d) => Number(d.subtotal)), 0)),
					max: String(Math.max(...data.map((d) => Number(d.subtotal)), 0)),
					count: data.length,
				},
			}
		})
	}

	async getSuppliersReport(
		query: dto.ProcurementReportRequestDto,
	): Promise<dto.SupplierReportResponseDto> {
		return record('ProcurementReportingService.getSuppliersReport', async () => {
			const data = await this.db
				.select({
					supplierId: suppliersTable.id,
					supplierName: suppliersTable.name,
					totalOrders: sql<number>`COUNT(DISTINCT ${purchaseOrdersTable.id})`,
					totalAmount: sql<number>`COALESCE(SUM(${purchaseOrdersTable.totalAmount}), 0)`,
					completedOrders: sql<number>`COUNT(CASE WHEN ${purchaseOrdersTable.status} = 'completed' THEN 1 END)`,
					pendingOrders: sql<number>`COUNT(CASE WHEN ${purchaseOrdersTable.status} != 'completed' THEN 1 END)`,
				})
				.from(purchaseOrdersTable)
				.innerJoin(suppliersTable, eq(purchaseOrdersTable.supplierId, suppliersTable.id))
				.where(
					and(
						gte(purchaseOrdersTable.transactionDate, query.dateFrom),
						lte(purchaseOrdersTable.transactionDate, query.dateTo),
					),
				)
				.groupBy(suppliersTable.id)
				.orderBy(sql`totalAmount DESC`)

			const totalAmount = data.reduce((s, d) => s + Number(d.totalAmount), 0)
			return {
				chartType: 'bar' as const,
				data: data.map((d) => ({
					...d,
					totalAmount: String(d.totalAmount),
					averageDeliveryDays: 0,
				})),
				summary: {
					total: String(totalAmount),
					average: String(data.length > 0 ? totalAmount / data.length : 0),
					min: String(Math.min(...data.map((d) => Number(d.totalAmount)), 0)),
					max: String(Math.max(...data.map((d) => Number(d.totalAmount)), 0)),
					count: data.length,
				},
			}
		})
	}

	async getTransfersReport(
		query: dto.ProcurementReportRequestDto,
	): Promise<dto.TransferReportResponseDto> {
		return record('ProcurementReportingService.getTransfersReport', async () => {
			const data = await this.db
				.select({
					transferId: stockTransfersTable.id,
					date: stockTransfersTable.transferDate,
					fromLocation: locationsTable.name,
					toLocation: locationsTable.name,
					materialId: materialsTable.id,
					materialName: materialsTable.name,
					quantity: stockTransferItemsTable.quantity,
					unitCost: stockTransferItemsTable.unitCost,
					totalCost: stockTransferItemsTable.totalCost,
					status: stockTransfersTable.status,
				})
				.from(stockTransfersTable)
				.innerJoin(
					stockTransferItemsTable,
					eq(stockTransfersTable.id, stockTransferItemsTable.transferId),
				)
				.innerJoin(materialsTable, eq(stockTransferItemsTable.materialId, materialsTable.id))
				.innerJoin(locationsTable, eq(stockTransfersTable.sourceLocationId, locationsTable.id))
				.where(
					and(
						gte(stockTransfersTable.transferDate, query.dateFrom),
						lte(stockTransfersTable.transferDate, query.dateTo),
						query.locationId
							? eq(stockTransfersTable.sourceLocationId, query.locationId)
							: undefined,
					),
				)
				.orderBy(stockTransfersTable.transferDate)

			const totalCost = data.reduce((s, d) => s + Number(d.totalCost), 0)
			return {
				chartType: 'bar' as const,
				data: data.map((d) => ({
					...d,
					quantity: Number(d.quantity),
					unitCost: String(d.unitCost),
					totalCost: String(d.totalCost),
				})),
				summary: {
					total: String(totalCost),
					average: String(data.length > 0 ? totalCost / data.length : 0),
					min: String(Math.min(...data.map((d) => Number(d.totalCost)), 0)),
					max: String(Math.max(...data.map((d) => Number(d.totalCost)), 0)),
					count: data.length,
				},
			}
		})
	}

	async getCostsReport(query: dto.ProcurementReportRequestDto): Promise<dto.CostReportResponseDto> {
		return record('ProcurementReportingService.getCostsReport', async () => {
			const data = await this.db
				.select({
					materialId: materialsTable.id,
					materialName: materialsTable.name,
					date: purchaseOrdersTable.transactionDate,
					unitPrice: purchaseOrderItemsTable.unitPrice,
					quantity: purchaseOrderItemsTable.quantity,
				})
				.from(purchaseOrdersTable)
				.innerJoin(
					purchaseOrderItemsTable,
					eq(purchaseOrdersTable.id, purchaseOrderItemsTable.orderId),
				)
				.innerJoin(materialsTable, eq(purchaseOrderItemsTable.materialId, materialsTable.id))
				.where(
					and(
						gte(purchaseOrdersTable.transactionDate, query.dateFrom),
						lte(purchaseOrdersTable.transactionDate, query.dateTo),
						query.materialId ? eq(purchaseOrderItemsTable.materialId, query.materialId) : undefined,
					),
				)
				.orderBy(purchaseOrdersTable.transactionDate)

			const totalCost = data.reduce((s, d) => s + Number(d.unitPrice) * Number(d.quantity), 0)
			return {
				chartType: 'line' as const,
				data: data.map((d) => ({
					...d,
					unitPrice: String(d.unitPrice),
					quantity: Number(d.quantity),
				})),
				summary: {
					total: String(totalCost),
					average: String(data.length > 0 ? totalCost / data.length : 0),
					min: String(Math.min(...data.map((d) => Number(d.unitPrice) * Number(d.quantity)), 0)),
					max: String(Math.max(...data.map((d) => Number(d.unitPrice) * Number(d.quantity)), 0)),
					count: data.length,
				},
			}
		})
	}
}

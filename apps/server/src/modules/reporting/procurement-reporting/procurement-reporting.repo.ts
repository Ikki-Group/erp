import { and, eq, gte, lte, sql } from 'drizzle-orm'

import {
	locationsTable,
	materialsTable,
	purchaseOrderItemsTable,
	purchaseOrdersTable,
	stockTransferItemsTable,
	stockTransfersTable,
	suppliersTable,
} from '@/db/schema'

import type { DbClient } from '@/infra/database'

import {  ProcurementReportRequestDto  } from './procurement-reporting.dto'

export class ProcurementReportingRepo {
	constructor(private readonly db: DbClient) {}

	async getPurchasesReport(query: ProcurementReportRequestDto) {
		const { dateFrom, dateTo, locationId, supplierId } = query

		return this.db
			.select({
				purchaseOrderId: purchaseOrdersTable.id,
				date: purchaseOrdersTable.transactionDate,
				supplierId: suppliersTable.id,
				supplierName: suppliersTable.name,
				materialId: materialsTable.id,
				materialName: materialsTable.name,
				qty: purchaseOrderItemsTable.quantity,
				unitPrice: purchaseOrderItemsTable.unitPrice,
				totalAmount: purchaseOrderItemsTable.subtotal,
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
					gte(purchaseOrdersTable.transactionDate, dateFrom),
					lte(purchaseOrdersTable.transactionDate, dateTo),
					locationId ? eq(purchaseOrdersTable.locationId, locationId) : undefined,
					supplierId ? eq(purchaseOrdersTable.supplierId, supplierId) : undefined,
				),
			)
			.orderBy(purchaseOrdersTable.transactionDate)
	}

	async getSuppliersReport(query: ProcurementReportRequestDto) {
		const { dateFrom, dateTo } = query

		return this.db
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
					gte(purchaseOrdersTable.transactionDate, dateFrom),
					lte(purchaseOrdersTable.transactionDate, dateTo),
				),
			)
			.groupBy(suppliersTable.id)
			.orderBy(sql`totalAmount DESC`)
	}

	async getTransfersReport(query: ProcurementReportRequestDto) {
		const { dateFrom, dateTo, locationId } = query

		return this.db
			.select({
				transferId: stockTransfersTable.id,
				date: stockTransfersTable.transferDate,
				fromLocation: locationsTable.name,
				toLocation: locationsTable.name,
				materialId: materialsTable.id,
				materialName: materialsTable.name,
				qty: stockTransferItemsTable.quantity,
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
					gte(stockTransfersTable.transferDate, dateFrom),
					lte(stockTransfersTable.transferDate, dateTo),
					locationId ? eq(stockTransfersTable.sourceLocationId, locationId) : undefined,
				),
			)
			.orderBy(stockTransfersTable.transferDate)
	}

	async getCostsReport(query: ProcurementReportRequestDto) {
		const { dateFrom, dateTo, materialId } = query

		return this.db
			.select({
				materialId: materialsTable.id,
				materialName: materialsTable.name,
				date: purchaseOrdersTable.transactionDate,
				unitPrice: purchaseOrderItemsTable.unitPrice,
				qty: purchaseOrderItemsTable.quantity,
			})
			.from(purchaseOrdersTable)
			.innerJoin(
				purchaseOrderItemsTable,
				eq(purchaseOrdersTable.id, purchaseOrderItemsTable.orderId),
			)
			.innerJoin(materialsTable, eq(purchaseOrderItemsTable.materialId, materialsTable.id))
			.where(
				and(
					gte(purchaseOrdersTable.transactionDate, dateFrom),
					lte(purchaseOrdersTable.transactionDate, dateTo),
					materialId ? eq(purchaseOrderItemsTable.materialId, materialId) : undefined,
				),
			)
			.orderBy(purchaseOrdersTable.transactionDate)
	}
}

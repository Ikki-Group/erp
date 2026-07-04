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

import type { DbContext } from '@/infra/database'

import { ProcurementReportRequestDto } from './procurement-reporting.contract'

export interface IProcurementReportingRepo {
	readonly db: DbContext
	getPurchasesReport(query: ProcurementReportRequestDto): Promise<
		Array<{
			purchaseOrderId: number
			date: Date
			supplierId: number
			supplierName: string
			materialId: number
			materialName: string
			qty: number
			unitPrice: number
			totalAmount: number
			status: string
		}>
	>
	getSuppliersReport(query: ProcurementReportRequestDto): Promise<
		Array<{
			supplierId: number
			supplierName: string
			totalOrders: number
			totalAmount: number
			completedOrders: number
			pendingOrders: number
		}>
	>
	getTransfersReport(query: ProcurementReportRequestDto): Promise<
		Array<{
			transferId: number
			date: Date
			fromLocation: string
			toLocation: string
			materialId: number
			materialName: string
			qty: number
			unitCost: number
			totalCost: number
			status: string
		}>
	>
	getCostsReport(query: ProcurementReportRequestDto): Promise<
		Array<{
			materialId: number
			materialName: string
			date: Date
			unitPrice: number
			qty: number
		}>
	>
}

export class ProcurementReportingRepo implements IProcurementReportingRepo {
	constructor(readonly db: DbContext) {}

	async getPurchasesReport(query: ProcurementReportRequestDto): Promise<
		Array<{
			purchaseOrderId: number
			date: Date
			supplierId: number
			supplierName: string
			materialId: number
			materialName: string
			qty: number
			unitPrice: number
			totalAmount: number
			status: string
		}>
	> {
		const { dateFrom, dateTo, locationId, supplierId } = query

		const rows = await this.db
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

		return rows as unknown as Array<{
			purchaseOrderId: number
			date: Date
			supplierId: number
			supplierName: string
			materialId: number
			materialName: string
			qty: number
			unitPrice: number
			totalAmount: number
			status: string
		}>
	}

	async getSuppliersReport(query: ProcurementReportRequestDto): Promise<
		Array<{
			supplierId: number
			supplierName: string
			totalOrders: number
			totalAmount: number
			completedOrders: number
			pendingOrders: number
		}>
	> {
		const { dateFrom, dateTo } = query

		const rows = await this.db
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

		return rows as unknown as Array<{
			supplierId: number
			supplierName: string
			totalOrders: number
			totalAmount: number
			completedOrders: number
			pendingOrders: number
		}>
	}

	async getTransfersReport(query: ProcurementReportRequestDto): Promise<
		Array<{
			transferId: number
			date: Date
			fromLocation: string
			toLocation: string
			materialId: number
			materialName: string
			qty: number
			unitCost: number
			totalCost: number
			status: string
		}>
	> {
		const { dateFrom, dateTo, locationId } = query

		const rows = await this.db
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

		return rows as unknown as Array<{
			transferId: number
			date: Date
			fromLocation: string
			toLocation: string
			materialId: number
			materialName: string
			qty: number
			unitCost: number
			totalCost: number
			status: string
		}>
	}

	async getCostsReport(query: ProcurementReportRequestDto): Promise<
		Array<{
			materialId: number
			materialName: string
			date: Date
			unitPrice: number
			qty: number
		}>
	> {
		const { dateFrom, dateTo, materialId } = query

		const rows = await this.db
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

		return rows as unknown as Array<{
			materialId: number
			materialName: string
			date: Date
			unitPrice: number
			qty: number
		}>
	}
}

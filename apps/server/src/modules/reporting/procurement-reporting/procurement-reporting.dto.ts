import { z } from 'zod'
import { zp } from '@/shared/schema'

import { ReportRequestDto, ReportSummaryDto, ChartTypeDto } from '../reporting.dto'

/** Purchase data */
export const PurchaseDto = z.object({
	purchaseOrderId: zp.num,
	date: zp.date,
	supplierId: zp.num,
	supplierName: zp.str,
	materialId: zp.num,
	materialName: zp.str,
	qty: zp.num,
	unitPrice: zp.decimal,
	totalAmount: zp.decimal,
	status: zp.str,
})
export type PurchaseDto = z.infer<typeof PurchaseDto>

/** Supplier performance data */
export const SupplierPerformanceDto = z.object({
	supplierId: zp.num,
	supplierName: zp.str,
	totalOrders: zp.num,
	totalAmount: zp.decimal,
	averageDeliveryDays: zp.num,
	completedOrders: zp.num,
	pendingOrders: zp.num,
})
export type SupplierPerformanceDto = z.infer<typeof SupplierPerformanceDto>

/** Transfer data */
export const TransferDto = z.object({
	transferId: zp.num,
	date: zp.date,
	fromLocation: zp.str,
	toLocation: zp.str,
	materialId: zp.num,
	materialName: zp.str,
	qty: zp.num,
	unitCost: zp.decimal,
	totalCost: zp.decimal,
	status: zp.str,
})
export type TransferDto = z.infer<typeof TransferDto>

/** Cost trend data */
export const CostTrendDto = z.object({
	materialId: zp.num,
	materialName: zp.str,
	date: zp.date,
	unitPrice: zp.decimal,
	qty: zp.num,
})
export type CostTrendDto = z.infer<typeof CostTrendDto>

/** Procurement report request */
export const ProcurementReportRequestDto = z.object({
	...ReportRequestDto.shape,
	supplierId: zp.num.optional(),
	materialId: zp.num.optional(),
})
export type ProcurementReportRequestDto = z.infer<typeof ProcurementReportRequestDto>

/** Purchase report response */
export const PurchaseReportResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(PurchaseDto),
	summary: ReportSummaryDto,
})
export type PurchaseReportResponseDto = z.infer<typeof PurchaseReportResponseDto>

/** Supplier report response */
export const SupplierReportResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(SupplierPerformanceDto),
	summary: ReportSummaryDto,
})
export type SupplierReportResponseDto = z.infer<typeof SupplierReportResponseDto>

/** Transfer report response */
export const TransferReportResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(TransferDto),
	summary: ReportSummaryDto,
})
export type TransferReportResponseDto = z.infer<typeof TransferReportResponseDto>

/** Cost report response */
export const CostReportResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(CostTrendDto),
	summary: ReportSummaryDto,
})
export type CostReportResponseDto = z.infer<typeof CostReportResponseDto>

import { z } from 'zod'

import { zp } from '@/core/validation'

import { ReportRequestDto, ReportSummaryDto, ChartTypeDto } from '../reporting.dto'

/** Stock level data */
export const StockLevelDto = z.object({
	productId: zp.num,
	productName: zp.str,
	sku: zp.str,
	currentStock: zp.num,
	reorderLevel: zp.num,
	unit: zp.str,
})
export type StockLevelDto = z.infer<typeof StockLevelDto>

/** Inventory movement data */
export const InventoryMovementDto = z.object({
	date: zp.date,
	quantityIn: zp.num,
	quantityOut: zp.num,
	netMovement: zp.num,
})
export type InventoryMovementDto = z.infer<typeof InventoryMovementDto>

/** Top products by stock value */
export const StockValueDto = z.object({
	productId: zp.num,
	productName: zp.str,
	sku: zp.str,
	quantity: zp.num,
	unitCost: zp.decimal,
	totalValue: zp.decimal,
})
export type StockValueDto = z.infer<typeof StockValueDto>

/** Low stock items */
export const LowStockItemDto = z.object({
	productId: zp.num,
	productName: zp.str,
	sku: zp.str,
	currentStock: zp.num,
	reorderLevel: zp.num,
	shortage: zp.num,
})
export type LowStockItemDto = z.infer<typeof LowStockItemDto>

/** Inventory report request */
export const InventoryReportRequestDto = ReportRequestDto.extend({
	locationId: zp.num.optional(),
	productId: zp.num.optional(),
})
export type InventoryReportRequestDto = z.infer<typeof InventoryReportRequestDto>

/** Stock level response */
export const StockLevelResponseDto = z.object({
	data: z.array(StockLevelDto),
	summary: ReportSummaryDto,
})
export type StockLevelResponseDto = z.infer<typeof StockLevelResponseDto>

/** Inventory movement chart response */
export const InventoryMovementChartResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(InventoryMovementDto),
	summary: ReportSummaryDto,
})
export type InventoryMovementChartResponseDto = z.infer<typeof InventoryMovementChartResponseDto>

/** Stock value response */
export const StockValueResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(StockValueDto),
	summary: ReportSummaryDto,
})
export type StockValueResponseDto = z.infer<typeof StockValueResponseDto>

/** Low stock response */
export const LowStockResponseDto = z.object({
	data: z.array(LowStockItemDto),
	summary: ReportSummaryDto,
})
export type LowStockResponseDto = z.infer<typeof LowStockResponseDto>

import { z } from 'zod'
import { zp } from '@/shared/schema'

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
export const InventoryReportRequestDto = z.object({
	...ReportRequestDto.shape,
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

/** Consumption data */
export const ConsumptionDto = z.object({
	materialId: zp.num,
	materialName: zp.str,
	materialType: zp.str,
	locationId: zp.num,
	locationName: zp.str,
	quantity: zp.num,
	unit: zp.str,
	cost: zp.decimal,
	date: zp.date,
})
export type ConsumptionDto = z.infer<typeof ConsumptionDto>

/** Opname variance data */
export const OpnameVarianceDto = z.object({
	materialId: zp.num,
	materialName: zp.str,
	locationId: zp.num,
	locationName: zp.str,
	expectedQty: zp.num,
	actualQty: zp.num,
	variance: zp.num,
	varianceCost: zp.decimal,
	adjustmentType: zp.str,
	date: zp.date,
})
export type OpnameVarianceDto = z.infer<typeof OpnameVarianceDto>

/** Waste data */
export const WasteDto = z.object({
	materialId: zp.num,
	materialName: zp.str,
	locationId: zp.num,
	locationName: zp.str,
	quantity: zp.num,
	unit: zp.str,
	cost: zp.decimal,
	reason: zp.str.optional(),
	date: zp.date,
})
export type WasteDto = z.infer<typeof WasteDto>

/** Consumption report response */
export const ConsumptionResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(ConsumptionDto),
	summary: ReportSummaryDto,
})
export type ConsumptionResponseDto = z.infer<typeof ConsumptionResponseDto>

/** Opname variance report response */
export const OpnameVarianceResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(OpnameVarianceDto),
	summary: ReportSummaryDto,
})
export type OpnameVarianceResponseDto = z.infer<typeof OpnameVarianceResponseDto>

/** Waste report response */
export const WasteResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(WasteDto),
	summary: ReportSummaryDto,
})
export type WasteResponseDto = z.infer<typeof WasteResponseDto>

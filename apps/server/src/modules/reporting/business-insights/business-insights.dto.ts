
import { ReportRequestDto, ReportSummaryDto, ChartTypeDto } from '../reporting.dto'
import { z, zp } from '@ikki/api-contract/validation'

/** Profitability data */
export const ProfitabilityDto = z.object({
	date: zp.date,
	revenue: zp.decimal,
	cogs: zp.decimal,
	expenses: zp.decimal,
	profit: zp.decimal,
	margin: zp.num,
})
export type ProfitabilityDto = z.infer<typeof ProfitabilityDto>

/** Location performance data */
export const LocationPerformanceDto = z.object({
	locationId: zp.num,
	locationName: zp.str,
	totalSales: zp.num,
	totalRevenue: zp.decimal,
	totalCost: zp.decimal,
	profit: zp.decimal,
	avgOrderValue: zp.decimal,
})
export type LocationPerformanceDto = z.infer<typeof LocationPerformanceDto>

/** Inventory turnover data */
export const InventoryTurnoverDto = z.object({
	materialId: zp.num,
	materialName: zp.str,
	cogs: zp.decimal,
	avgInventory: zp.decimal,
	turnoverRatio: zp.num,
	daysInInventory: zp.num,
})
export type InventoryTurnoverDto = z.infer<typeof InventoryTurnoverDto>

/** Business insights request */
export const BusinessInsightsRequestDto = ReportRequestDto.extend({
	locationId: zp.num.optional(),
	materialId: zp.num.optional(),
})
export type BusinessInsightsRequestDto = z.infer<typeof BusinessInsightsRequestDto>

/** Profitability response */
export const ProfitabilityResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(ProfitabilityDto),
	summary: ReportSummaryDto,
})
export type ProfitabilityResponseDto = z.infer<typeof ProfitabilityResponseDto>

/** Location performance response */
export const LocationPerformanceResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(LocationPerformanceDto),
	summary: ReportSummaryDto,
})
export type LocationPerformanceResponseDto = z.infer<typeof LocationPerformanceResponseDto>

/** Inventory turnover response */
export const InventoryTurnoverResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(InventoryTurnoverDto),
	summary: ReportSummaryDto,
})
export type InventoryTurnoverResponseDto = z.infer<typeof InventoryTurnoverResponseDto>

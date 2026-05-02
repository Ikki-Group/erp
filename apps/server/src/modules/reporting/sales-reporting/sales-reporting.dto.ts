import { z } from 'zod'

import { zp } from '@/core/validation'

import { ReportRequestDto, ReportSummaryDto, ChartTypeDto } from '../reporting.dto'

/** Sales revenue over time */
export const SalesRevenueDto = z.object({
	date: zp.date,
	revenue: zp.decimal,
	orderCount: zp.num,
})
export type SalesRevenueDto = z.infer<typeof SalesRevenueDto>

/** Top selling products */
export const TopProductDto = z.object({
	productId: zp.num,
	productName: zp.str,
	sku: zp.str.optional(),
	totalQuantity: zp.num,
	totalRevenue: zp.decimal,
})
export type TopProductDto = z.infer<typeof TopProductDto>

/** Sales by location */
export const SalesByLocationDto = z.object({
	locationId: zp.num,
	locationName: zp.str.optional(),
	revenue: zp.decimal,
	orderCount: zp.num,
})
export type SalesByLocationDto = z.infer<typeof SalesByLocationDto>

/** Sales by type (dine-in, take-away, delivery) */
export const SalesByTypeDto = z.object({
	salesTypeId: zp.num,
	salesTypeName: zp.str.optional(),
	revenue: zp.decimal,
	orderCount: zp.num,
	percentage: zp.decimal,
})
export type SalesByTypeDto = z.infer<typeof SalesByTypeDto>

/** Sales report request */
export const SalesReportRequestDto = ReportRequestDto.extend({
	salesTypeId: zp.num.optional(),
})
export type SalesReportRequestDto = z.infer<typeof SalesReportRequestDto>

/** Sales revenue chart response */
export const SalesRevenueChartResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(SalesRevenueDto),
	summary: ReportSummaryDto,
})
export type SalesRevenueChartResponseDto = z.infer<typeof SalesRevenueChartResponseDto>

/** Top products chart response */
export const TopProductsChartResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(TopProductDto),
	summary: ReportSummaryDto,
})
export type TopProductsChartResponseDto = z.infer<typeof TopProductsChartResponseDto>

/** Sales by location chart response */
export const SalesByLocationChartResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(SalesByLocationDto),
	summary: ReportSummaryDto,
})
export type SalesByLocationChartResponseDto = z.infer<typeof SalesByLocationChartResponseDto>

/** Sales by type chart response */
export const SalesByTypeChartResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(SalesByTypeDto),
	summary: ReportSummaryDto,
})
export type SalesByTypeChartResponseDto = z.infer<typeof SalesByTypeChartResponseDto>

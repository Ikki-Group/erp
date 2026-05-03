import { z } from 'zod'

import { zp } from '@/lib/validation'

/** Date range filter for reports */
export const DateRangeDto = z.object({
	dateFrom: zp.date,
	dateTo: zp.date,
})
export type DateRangeDto = z.infer<typeof DateRangeDto>

/** Chart data point with label and value */
export const ChartDataPointDto = z.object({
	label: zp.str,
	value: zp.decimal,
})
export type ChartDataPointDto = z.infer<typeof ChartDataPointDto>

/** Time series data point with date and value */
export const TimeSeriesDataPointDto = z.object({
	date: zp.date,
	value: zp.decimal,
})
export type TimeSeriesDataPointDto = z.infer<typeof TimeSeriesDataPointDto>

/** Chart types supported */
export const ChartTypeDto = z.enum(['bar', 'line', 'pie', 'area', 'donut'])
export type ChartTypeDto = z.infer<typeof ChartTypeDto>

/** Report request with date range and optional filters */
export const ReportRequestDto = z.object({
	...DateRangeDto.shape,
	locationId: zp.num.optional(),
	groupBy: z.enum(['day', 'week', 'month', 'year']).optional(),
})
export type ReportRequestDto = z.infer<typeof ReportRequestDto>

/** Summary statistics for reports */
export const ReportSummaryDto = z.object({
	total: zp.decimal,
	average: zp.decimal,
	min: zp.decimal,
	max: zp.decimal,
	count: zp.num,
})
export type ReportSummaryDto = z.infer<typeof ReportSummaryDto>

/** Chart response with data and summary */
export const ChartResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(ChartDataPointDto),
	summary: ReportSummaryDto,
})
export type ChartResponseDto = z.infer<typeof ChartResponseDto>

/** Time series chart response */
export const TimeSeriesChartResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(TimeSeriesDataPointDto),
	summary: ReportSummaryDto,
})
export type TimeSeriesChartResponseDto = z.infer<typeof TimeSeriesChartResponseDto>

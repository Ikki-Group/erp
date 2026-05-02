import { z } from 'zod'

import { zp } from '@/lib/validation'

/** Date range filter for reports */
export const DateRangeDto = z.object({
	dateFrom: zp.date,
	dateTo: zp.date,
})
export type DateRangeDto = z.infer<typeof DateRangeDto>

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

/** Chart types supported */
export const ChartTypeDto = z.enum(['bar', 'line', 'pie', 'area', 'donut'])
export type ChartTypeDto = z.infer<typeof ChartTypeDto>

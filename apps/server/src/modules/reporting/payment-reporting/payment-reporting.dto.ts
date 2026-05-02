import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

import { DateRangeDto, ReportRequestDto, ChartDataPointDto, TimeSeriesDataPointDto, ReportSummaryDto, ChartTypeDto } from '../reporting.dto'

/** Payment by method */
export const PaymentByMethodDto = z.object({
	method: zp.str,
	category: zp.str,
	totalAmount: zp.decimal,
	count: zp.num,
	percentage: zp.decimal,
})
export type PaymentByMethodDto = z.infer<typeof PaymentByMethodDto>

/** Payment over time */
export const PaymentOverTimeDto = z.object({
	date: zp.date,
	payableAmount: zp.decimal,
	receivableAmount: zp.decimal,
	totalAmount: zp.decimal,
})
export type PaymentOverTimeDto = z.infer<typeof PaymentOverTimeDto>

/** Payment by account */
export const PaymentByAccountDto = z.object({
	accountId: zp.num,
	accountName: zp.str,
	accountCode: zp.str,
	totalAmount: zp.decimal,
	count: zp.num,
})
export type PaymentByAccountDto = z.infer<typeof PaymentByAccountDto>

/** Payment report request */
export const PaymentReportRequestDto = ReportRequestDto.extend({
	accountId: zp.num.optional(),
	method: zp.str.optional(),
	type: zp.enum(['payable', 'receivable']).optional(),
})
export type PaymentReportRequestDto = z.infer<typeof PaymentReportRequestDto>

/** Payment by method response */
export const PaymentByMethodResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(PaymentByMethodDto),
	summary: ReportSummaryDto,
})
export type PaymentByMethodResponseDto = z.infer<typeof PaymentByMethodResponseDto>

/** Payment over time response */
export const PaymentOverTimeResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(PaymentOverTimeDto),
	summary: ReportSummaryDto,
})
export type PaymentOverTimeResponseDto = z.infer<typeof PaymentOverTimeResponseDto>

/** Payment by account response */
export const PaymentByAccountResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(PaymentByAccountDto),
	summary: ReportSummaryDto,
})
export type PaymentByAccountResponseDto = z.infer<typeof PaymentByAccountResponseDto>

import { z } from 'zod'

import { zp } from '@/core/validation'

import { ReportRequestDto, ReportSummaryDto, ChartTypeDto } from '../reporting.dto'

/** Cash flow data point */
export const CashFlowDataPointDto = z.object({
	date: zp.date,
	inflow: zp.decimal,
	outflow: zp.decimal,
	net: zp.decimal,
})
export type CashFlowDataPointDto = z.infer<typeof CashFlowDataPointDto>

/** Account balance data */
export const AccountBalanceDto = z.object({
	accountId: zp.num,
	accountName: zp.str,
	accountCode: zp.str,
	balance: zp.decimal,
})
export type AccountBalanceDto = z.infer<typeof AccountBalanceDto>

/** Expenditure by category */
export const ExpenditureByCategoryDto = z.object({
	categoryId: zp.num,
	categoryName: zp.str,
	totalAmount: zp.decimal,
	percentage: zp.decimal,
})
export type ExpenditureByCategoryDto = z.infer<typeof ExpenditureByCategoryDto>

/** Finance report request */
export const FinanceReportRequestDto = ReportRequestDto.extend({
	accountId: zp.num.optional(),
})
export type FinanceReportRequestDto = z.infer<typeof FinanceReportRequestDto>

/** Cash flow chart response */
export const CashFlowChartResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(CashFlowDataPointDto),
	summary: ReportSummaryDto,
})
export type CashFlowChartResponseDto = z.infer<typeof CashFlowChartResponseDto>

/** Account balance response */
export const AccountBalanceResponseDto = z.object({
	data: z.array(AccountBalanceDto),
	summary: ReportSummaryDto,
})
export type AccountBalanceResponseDto = z.infer<typeof AccountBalanceResponseDto>

/** Expenditure by category response */
export const ExpenditureByCategoryResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(ExpenditureByCategoryDto),
	summary: ReportSummaryDto,
})
export type ExpenditureByCategoryResponseDto = z.infer<typeof ExpenditureByCategoryResponseDto>

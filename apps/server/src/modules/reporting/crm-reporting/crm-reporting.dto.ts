import { z } from 'zod'

import { ReportRequestDto, ReportSummaryDto, ChartTypeDto } from '../reporting.dto'
import { zp } from '@/lib/validation'

/** Customer growth data */
export const CustomerGrowthDto = z.object({
	date: zp.date,
	newCustomers: zp.num,
	totalCustomers: zp.num,
})
export type CustomerGrowthDto = z.infer<typeof CustomerGrowthDto>

/** Customer by tier */
export const CustomerByTierDto = z.object({
	tierId: zp.num,
	tierName: zp.str,
	customerCount: zp.num,
	percentage: zp.decimal,
})
export type CustomerByTierDto = z.infer<typeof CustomerByTierDto>

/** Top customers by spending */
export const TopCustomerDto = z.object({
	customerId: zp.num,
	customerName: zp.str,
	email: zp.str,
	totalSpent: zp.decimal,
	orderCount: zp.num,
})
export type TopCustomerDto = z.infer<typeof TopCustomerDto>

/** Loyalty points summary */
export const LoyaltyPointsSummaryDto = z.object({
	totalPointsIssued: zp.decimal,
	totalPointsRedeemed: zp.decimal,
	pointsBalance: zp.decimal,
})
export type LoyaltyPointsSummaryDto = z.infer<typeof LoyaltyPointsSummaryDto>

/** CRM report request */
export const CrmReportRequestDto = ReportRequestDto.extend({
	tierId: zp.num.optional(),
})
export type CrmReportRequestDto = z.infer<typeof CrmReportRequestDto>

/** Customer growth chart response */
export const CustomerGrowthChartResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(CustomerGrowthDto),
	summary: ReportSummaryDto,
})
export type CustomerGrowthChartResponseDto = z.infer<typeof CustomerGrowthChartResponseDto>

/** Customer by tier response */
export const CustomerByTierResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(CustomerByTierDto),
	summary: ReportSummaryDto,
})
export type CustomerByTierResponseDto = z.infer<typeof CustomerByTierResponseDto>

/** Top customers response */
export const TopCustomersResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(TopCustomerDto),
	summary: ReportSummaryDto,
})
export type TopCustomersResponseDto = z.infer<typeof TopCustomersResponseDto>

/** Loyalty points response */
export const LoyaltyPointsResponseDto = z.object({
	data: LoyaltyPointsSummaryDto,
})
export type LoyaltyPointsResponseDto = z.infer<typeof LoyaltyPointsResponseDto>

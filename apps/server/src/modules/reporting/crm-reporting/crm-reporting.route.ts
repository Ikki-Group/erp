import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createSuccessResponseDto } from '@/shared/schema/response'

import * as dto from './crm-reporting.contract'
import type { CrmReportingModule } from './crm-reporting.module'

export function createCrmReportingRoute(m: CrmReportingModule) {
	return new Elysia({ prefix: '/crm' })
		.use(authPluginMacro)
		.get(
			'/customer-growth',
			async ({ query }) => {
				const result = await m.handleGetCustomerGrowth(query)
				return res.ok(result)
			},
			{
				query: dto.CrmReportRequestDto,
				response: createSuccessResponseDto(dto.CustomerGrowthChartResponseDto),
				auth: true,
			},
		)
		.get(
			'/customers-by-tier',
			async ({ query }) => {
				const result = await m.handleGetCustomersByTier(query)
				return res.ok(result)
			},
			{
				query: dto.CrmReportRequestDto,
				response: createSuccessResponseDto(dto.CustomerByTierResponseDto),
				auth: true,
			},
		)
		.get(
			'/top-customers',
			async ({ query }) => {
				const result = await m.handleGetTopCustomers(query)
				return res.ok(result)
			},
			{
				query: dto.CrmReportRequestDto,
				response: createSuccessResponseDto(dto.TopCustomersResponseDto),
				auth: true,
			},
		)
		.get(
			'/loyalty-points',
			async ({ query }) => {
				const result = await m.handleGetLoyaltyPointsSummary(query)
				return res.ok(result)
			},
			{
				query: dto.CrmReportRequestDto,
				response: createSuccessResponseDto(dto.LoyaltyPointsResponseDto),
				auth: true,
			},
		)
}

import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createSuccessResponseSchema } from '@/core/validation'

import * as dto from './crm-reporting.dto'
import type { CrmReportingService } from './crm-reporting.service'

export function initCrmReportingRoute(service: CrmReportingService) {
	return new Elysia({ prefix: '/crm' })
		.use(authPluginMacro)
		.get(
			'/customer-growth',
			async ({ query }: { query: dto.CrmReportRequestDto }) => {
				const result = await service.getCustomerGrowth(query)
				return res.ok(result)
			},
			{
				query: dto.CrmReportRequestDto,
				response: createSuccessResponseSchema(dto.CustomerGrowthChartResponseDto),
				auth: true,
			},
		)
		.get(
			'/customers-by-tier',
			async ({ query }: { query: dto.CrmReportRequestDto }) => {
				const result = await service.getCustomersByTier(query)
				return res.ok(result)
			},
			{
				query: dto.CrmReportRequestDto,
				response: createSuccessResponseSchema(dto.CustomerByTierResponseDto),
				auth: true,
			},
		)
		.get(
			'/top-customers',
			async ({ query }: { query: dto.CrmReportRequestDto }) => {
				const result = await service.getTopCustomers(query)
				return res.ok(result)
			},
			{
				query: dto.CrmReportRequestDto,
				response: createSuccessResponseSchema(dto.TopCustomersResponseDto),
				auth: true,
			},
		)
		.get(
			'/loyalty-points',
			async ({ query }: { query: dto.CrmReportRequestDto }) => {
				const result = await service.getLoyaltyPointsSummary(query)
				return res.ok(result)
			},
			{
				query: dto.CrmReportRequestDto,
				response: createSuccessResponseSchema(dto.LoyaltyPointsResponseDto),
				auth: true,
			},
		)
}

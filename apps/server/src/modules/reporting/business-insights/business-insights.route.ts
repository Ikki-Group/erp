import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createSuccessResponseDto } from '@/shared/schema/response'

import * as dto from './business-insights.contract'
import type { BusinessInsightsModule } from './business-insights.module'

export function createBusinessInsightsRoute(m: BusinessInsightsModule) {
	return new Elysia({ prefix: '/insights' })
		.use(authPluginMacro)
		.get(
			'/profitability',
			async ({ query }) => {
				const result = await m.handleGetProfitability(query)
				return res.ok(result)
			},
			{
				query: dto.BusinessInsightsRequestDto,
				response: createSuccessResponseDto(dto.ProfitabilityResponseDto),
				auth: true,
			},
		)
		.get(
			'/location',
			async ({ query }) => {
				const result = await m.handleGetLocationPerformance(query)
				return res.ok(result)
			},
			{
				query: dto.BusinessInsightsRequestDto,
				response: createSuccessResponseDto(dto.LocationPerformanceResponseDto),
				auth: true,
			},
		)
		.get(
			'/turnover',
			async ({ query }) => {
				const result = await m.handleGetInventoryTurnover(query)
				return res.ok(result)
			},
			{
				query: dto.BusinessInsightsRequestDto,
				response: createSuccessResponseDto(dto.InventoryTurnoverResponseDto),
				auth: true,
			},
		)
}

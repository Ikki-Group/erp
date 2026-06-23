import { createSuccessResponseSchema } from '@/shared/schema/response'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import * as dto from './business-insights.contract'
import type { BusinessInsightsService } from './business-insights.service'

export function initBusinessInsightsRoute(service: BusinessInsightsService) {
	return new Elysia({ prefix: '/insights' })
		.use(authPluginMacro)
		.get(
			'/profitability',
			async ({ query }: { query: dto.BusinessInsightsRequestDto }) => {
				const result = await service.getProfitability(query)
				return res.ok(result)
			},
			{
				query: dto.BusinessInsightsRequestDto,
				response: createSuccessResponseSchema(dto.ProfitabilityResponseDto),
				auth: true,
			},
		)
		.get(
			'/location',
			async ({ query }: { query: dto.BusinessInsightsRequestDto }) => {
				const result = await service.getLocationPerformance(query)
				return res.ok(result)
			},
			{
				query: dto.BusinessInsightsRequestDto,
				response: createSuccessResponseSchema(dto.LocationPerformanceResponseDto),
				auth: true,
			},
		)
		.get(
			'/turnover',
			async ({ query }: { query: dto.BusinessInsightsRequestDto }) => {
				const result = await service.getInventoryTurnover(query)
				return res.ok(result)
			},
			{
				query: dto.BusinessInsightsRequestDto,
				response: createSuccessResponseSchema(dto.InventoryTurnoverResponseDto),
				auth: true,
			},
		)
}

import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import * as dto from './analytics.contract'
import type { AnalyticsService } from './analytics.service'

export function initAnalyticsRoute(service: AnalyticsService) {
	return new Elysia({ prefix: '/analytics', detail: { tags: ['Dashboard - Analytics'] } })
		.use(authPluginMacro)
		.post(
			'/pnl',
			async ({ body }) => {
				const { startDate, endDate } = body
				const result = await service.handleGetPnL(startDate, endDate)
				return res.ok(result)
			},
			{ body: dto.PnLRequestDto, auth: true },
		)
		.post(
			'/top-sales',
			async ({ body }) => {
				const { startDate, endDate, limit } = body
				const result = await service.handleGetTopSales(startDate, endDate, limit)
				return res.ok(result)
			},
			{ body: dto.TopSalesRequestDto, auth: true },
		)
}

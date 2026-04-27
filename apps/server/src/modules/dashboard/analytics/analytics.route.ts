import { Elysia } from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import * as dto from './analytics.dto'
import type { AnalyticsService } from './analytics.service'

export function initAnalyticsRoute(service: AnalyticsService) {
	return new Elysia({ prefix: '/analytics', detail: { tags: ['Dashboard - Analytics'] } })
		.use(authPluginMacro)
		.post(
			'/pnl',
			async ({ body }) => {
				const { startDate, endDate } = body
				const result = await service.getPnL(startDate, endDate)
				return res.ok(result)
			},
			{ body: dto.PnLRequestDto, auth: true },
		)
		.post(
			'/top-sales',
			async ({ body }) => {
				const { startDate, endDate, limit } = body
				const result = await service.getTopSales(startDate, endDate, limit)
				return res.ok(result)
			},
			{ body: dto.TopSalesRequestDto, auth: true },
		)
}

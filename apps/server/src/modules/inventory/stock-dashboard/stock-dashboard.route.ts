import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import { DashboardKpiFilterDto, DashboardKpiSelectDto } from './stock-dashboard.dto'
import type { StockDashboardService } from './stock-dashboard.service'
import { createSuccessResponseSchema } from '@/lib/validation'

export function initStockDashboardRoute(s: StockDashboardService) {
	return new Elysia({ prefix: '/dashboard' }).use(authPluginMacro).get(
		'/kpi',
		// @ts-expect-error
		async function kpi({ query }) {
			const result = await s.handleKpi(query)
			return res.ok(result)
		},
		{
			query: DashboardKpiFilterDto,
			response: createSuccessResponseSchema(DashboardKpiSelectDto),
			auth: true,
			detail: { tags: ['Inventory Dashboard'] },
		},
	)
}

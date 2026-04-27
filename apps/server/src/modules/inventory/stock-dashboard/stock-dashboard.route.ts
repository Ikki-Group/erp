import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createSuccessResponseSchema } from '@/core/validation'

import { DashboardKpiFilterDto, DashboardKpiSelectDto } from './stock-dashboard.dto'
import type { StockDashboardService } from './stock-dashboard.service'

export function initStockDashboardRoute(s: StockDashboardService) {
	return new Elysia({ prefix: '/dashboard' }).use(authPluginMacro).get(
		'/kpi',
		// @ts-ignore
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

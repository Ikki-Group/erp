import { createSuccessResponseDto } from '@/shared/schema/response'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import { DashboardKpiFilterDto, DashboardKpiSelectDto } from './stock-dashboard.contract'
import type { StockDashboardService } from './stock-dashboard.service'

export function initStockDashboardRoute(s: StockDashboardService) {
	return new Elysia({ prefix: '/dashboard' }).use(authPluginMacro).get(
		'/kpi',
		async function kpi(context) {
			const result = await s.handleKpi(context.query)
			return res.ok(result)
		},
		{
			query: DashboardKpiFilterDto,
			response: createSuccessResponseDto(DashboardKpiSelectDto),
			auth: true,
			detail: { tags: ['Inventory Dashboard'] },
		},
	)
}

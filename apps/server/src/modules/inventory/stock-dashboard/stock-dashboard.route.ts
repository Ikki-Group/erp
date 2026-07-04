import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createSuccessResponseDto } from '@/shared/schema/response'

import { DashboardKpiFilterDto, DashboardKpiSelectDto } from './stock-dashboard.contract'
import type { StockDashboardModule } from './stock-dashboard.module'

export function createStockDashboardRoute(m: StockDashboardModule) {
	return new Elysia({ prefix: '/dashboard' })
		.use(authPluginMacro)
		.get(
			'/kpi',
			async ({ query }) => {
				const result = await m.handleKpi(query)
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

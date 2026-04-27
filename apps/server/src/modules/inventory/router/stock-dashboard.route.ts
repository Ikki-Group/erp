import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createSuccessResponseSchema } from '@/core/validation'

import { DashboardKpiFilterDto, DashboardKpiSelectDto } from '../dto'
import type { InventoryServiceModule } from '../service'

export function initStockDashboardRoute(s: InventoryServiceModule) {
	return new Elysia({ prefix: '/dashboard' }).use(authPluginMacro).get(
		'/kpi',
		// @ts-ignore
		async function kpi({ query }) {
			const result = await s.dashboard.handleKpi(query)
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

import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createSuccessResponseSchema } from '@/core/validation'

import { dashboardKpiFilterSchema, dashboardKpiSelectSchema } from '../dto'
import type { InventoryServiceModule } from '../service'

export function initStockDashboardRoute(s: InventoryServiceModule) {
	return new Elysia({ prefix: '/dashboard' }).use(authPluginMacro).get(
		'/kpi',
		async function kpi({ query }) {
			const result = await s.dashboard.handleKpi(query)
			return res.ok(result)
		},
		{
			query: dashboardKpiFilterSchema,
			response: createSuccessResponseSchema(dashboardKpiSelectSchema),
			auth: true,
			detail: { tags: ['Inventory Dashboard'] },
		},
	)
}

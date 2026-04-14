import { Elysia } from 'elysia'
import type { DashboardServiceModule } from '../service'
import { initSettingsRoute } from './settings.route'
import { AnalyticsRoute } from './analytics.route'

export function initDashboardRouteModule(module: DashboardServiceModule) {
	return new Elysia({ prefix: '/dashboard', detail: { tags: ['Dashboard'] } })
		.use(initSettingsRoute(module))
		.use(AnalyticsRoute(module.analytics))
}

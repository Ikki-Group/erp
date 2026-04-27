import { Elysia } from 'elysia'

import type { FinanceServiceModule } from '@/modules/finance'
import type { IamServiceModule } from '@/modules/iam'
import type { LocationServiceModule } from '@/modules/location'
import type { SalesServiceModule } from '@/modules/sales'

import { initAnalyticsRoute } from './analytics/analytics.route'
import { AnalyticsService } from './analytics/analytics.service'
import { initSettingsRoute } from './settings/settings.route'
import { SettingsService } from './settings/settings.service'

export class DashboardServiceModule {
	public readonly settings: SettingsService
	public readonly analytics: AnalyticsService

	constructor(
		iamSvc: IamServiceModule,
		locationSvc: LocationServiceModule,
		_finance: FinanceServiceModule,
		_sales: SalesServiceModule,
	) {
		this.settings = new SettingsService(iamSvc, locationSvc)
		this.analytics = new AnalyticsService()
	}
}

export function initDashboardRouteModule(module: DashboardServiceModule) {
	return new Elysia({ prefix: '/dashboard', detail: { tags: ['Dashboard'] } })
		.use(initSettingsRoute(module.settings))
		.use(initAnalyticsRoute(module.analytics))
}

export * from './settings/settings.dto'
export * from './settings/settings.service'
export * from './settings/settings.route'
export * from './analytics/analytics.dto'
export * from './analytics/analytics.service'
export * from './analytics/analytics.route'

import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

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
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
		iamSvc: IamServiceModule,
		locationSvc: LocationServiceModule,
		_finance: FinanceServiceModule,
		_sales: SalesServiceModule,
	) {
		this.settings = new SettingsService(iamSvc, locationSvc)
		this.analytics = new AnalyticsService(this.db, this.cacheClient)
	}
}

export function initDashboardRouteModule(module: DashboardServiceModule) {
	return new Elysia({ prefix: '/dashboard', detail: { tags: ['Dashboard'] } })
		.use(initSettingsRoute(module.settings))
		.use(initAnalyticsRoute(module.analytics))
}

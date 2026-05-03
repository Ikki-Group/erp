import { Elysia } from 'elysia'

import type { DbClient } from '@/core/database'

import type { CacheClient } from '@/lib/cache'

import type { FinanceServiceModule } from '@/modules/finance'
import type { IamServiceModule } from '@/modules/iam'
import type { LocationServiceModule } from '@/modules/location'
import type { SalesServiceModule } from '@/modules/sales'

interface DashboardServiceModuleDeps {
	iam: IamServiceModule
	location: LocationServiceModule
	finance: FinanceServiceModule
	sales: SalesServiceModule
}

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
		private readonly deps: DashboardServiceModuleDeps,
	) {
		this.settings = new SettingsService(this.deps.iam, this.deps.location)
		this.analytics = new AnalyticsService(this.db, this.cacheClient)
	}
}

export function initDashboardRouteModule(module: DashboardServiceModule) {
	return new Elysia({ prefix: '/dashboard', detail: { tags: ['Dashboard'] } })
		.use(initSettingsRoute(module.settings))
		.use(initAnalyticsRoute(module.analytics))
}

export { SettingsSummaryDto } from './settings/settings.dto'
export type { SettingsService } from './settings/settings.service'

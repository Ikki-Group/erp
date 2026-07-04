import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import type { FinanceServiceModule as FinanceModule } from '@/modules/finance'
import type { IamModule } from '@/modules/iam'
import type { LocationModule } from '@/modules/location'
import type { SalesModule } from '@/modules/sales'

import { createAnalyticsModule, type AnalyticsModule } from './analytics/analytics.module'
import { initAnalyticsRoute } from './analytics/analytics.route'
import { initSettingsRoute } from './settings/settings.route'
import { SettingsService } from './settings/settings.service'

interface DashboardServiceModuleDeps {
	iam: IamModule
	location: LocationModule
	finance: FinanceModule
	sales: SalesModule
}

export class DashboardServiceModule {
	public readonly settings: SettingsService
	public readonly analytics: AnalyticsModule

	constructor(
		db: DbContext,
		cacheClient: CacheClient,
		deps: DashboardServiceModuleDeps,
	) {
		this.settings = new SettingsService(deps.iam, deps.location)
		this.analytics = createAnalyticsModule(db, cacheClient)
	}
}

export function initDashboardRouteModule(module: DashboardServiceModule) {
	return new Elysia({ prefix: '/dashboard', detail: { tags: ['Dashboard'] } })
		.use(initSettingsRoute(module.settings))
		.use(initAnalyticsRoute(module.analytics))
}

export { SettingsSummaryDto } from './settings/settings.contract'
export type { SettingsService } from './settings/settings.service'

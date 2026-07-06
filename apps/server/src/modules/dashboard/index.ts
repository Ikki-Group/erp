import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import type { FinanceModule } from '@/modules/finance'
import type { IamModule } from '@/modules/iam'
import type { LocationModule } from '@/modules/location'
import type { SalesModule } from '@/modules/sales'

import { createAnalyticsModule, type AnalyticsModule } from './analytics/analytics.module'
import { initAnalyticsRoute } from './analytics/analytics.route'
import { createSettingsModule, type SettingsModule } from './settings/settings.module'
import { createSettingsRoute } from './settings/settings.route'

interface DashboardServiceModuleDeps {
	iam: IamModule
	location: LocationModule
	finance: FinanceModule
	sales: SalesModule
}

export class DashboardServiceModule {
	public readonly settings: SettingsModule
	public readonly analytics: AnalyticsModule

	constructor(
		db: DbContext,
		cacheClient: CacheClient,
		deps: DashboardServiceModuleDeps,
	) {
		this.settings = createSettingsModule({
			iamUser: deps.iam.user,
			iamRole: deps.iam.role,
			location: deps.location,
		})
		this.analytics = createAnalyticsModule(db, cacheClient)
	}
}

export function initDashboardRouteModule(module: DashboardServiceModule) {
	return new Elysia({ prefix: '/dashboard', detail: { tags: ['Dashboard'] } })
		.use(createSettingsRoute(module.settings))
		.use(initAnalyticsRoute(module.analytics))
}

export { SettingsSummaryDto } from './settings/settings.contract'
export type { SettingsModule } from './settings/settings.module'

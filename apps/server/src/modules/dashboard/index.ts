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

export interface DashboardServiceModule {
	settings: SettingsModule
	analytics: AnalyticsModule
}

export function createDashboardServiceModule(
	db: DbContext,
	cacheClient: CacheClient,
	deps: DashboardServiceModuleDeps,
): DashboardServiceModule {
	const settings = createSettingsModule({
		iamUser: deps.iam.user,
		iamRole: deps.iam.role,
		location: deps.location,
	})
	const analytics = createAnalyticsModule(db, cacheClient)

	return { settings, analytics }
}

export function initDashboardRouteModule(module: DashboardServiceModule) {
	return new Elysia({ prefix: '/dashboard', detail: { tags: ['Dashboard'] } })
		.use(createSettingsRoute(module.settings))
		.use(initAnalyticsRoute(module.analytics))
}

export { SettingsSummaryDto } from './settings/settings.contract'
export type { SettingsModule } from './settings/settings.module'

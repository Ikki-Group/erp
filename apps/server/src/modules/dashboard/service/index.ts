import type { FinanceServiceModule } from '@/modules/finance/service'
import type { IamServiceModule } from '@/modules/iam'
import type { LocationServiceModule } from '@/modules/location'
import type { SalesServiceModule } from '@/modules/sales/service'

import { AnalyticsService } from './analytics.service'
import { SettingsService } from './settings.service'

export class DashboardServiceModule {
	public settings: SettingsService
	public analytics: AnalyticsService

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

export * from './settings.service'
export * from './analytics.service'

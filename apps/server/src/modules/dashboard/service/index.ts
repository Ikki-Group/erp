import type { FinanceServiceModule } from '@/modules/finance/service'
import type { IamServiceModule } from '@/modules/iam/service'
import type { LocationServiceModule } from '@/modules/location/service'
import type { SalesServiceModule } from '@/modules/sales/service'

import { AnalyticsService } from './analytics.service'
import { SettingsService } from './settings.service'

export class DashboardServiceModule {
	public settings: SettingsService
	public analytics: AnalyticsService

	constructor(
		iam: IamServiceModule,
		location: LocationServiceModule,
		_finance: FinanceServiceModule,
		_sales: SalesServiceModule,
	) {
		this.settings = new SettingsService(iam, location)
		this.analytics = new AnalyticsService()
	}
}

export * from './settings.service'
export * from './analytics.service'

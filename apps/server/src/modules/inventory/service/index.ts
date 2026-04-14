import type { MaterialServiceModule } from '@/modules/material/service'

export * from './stock-summary.service'
export * from './stock-transaction.service'
export * from './stock-alert.service'
export * from './stock-dashboard.service'

import { StockSummaryService } from './stock-summary.service'
import { StockTransactionService } from './stock-transaction.service'
import { StockAlertService } from './stock-alert.service'
import { StockDashboardService } from './stock-dashboard.service'

export class InventoryServiceModule {
	public readonly transaction: StockTransactionService
	public readonly summary: StockSummaryService
	public readonly alert: StockAlertService
	public readonly dashboard: StockDashboardService

	constructor(materialServiceModule: MaterialServiceModule) {
		this.transaction = new StockTransactionService(materialServiceModule.mLocation)
		this.summary = new StockSummaryService(materialServiceModule.mLocation)
		this.alert = new StockAlertService()
		this.dashboard = new StockDashboardService()
	}
}

import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import type { MaterialServiceModule } from '@/modules/material'

import { StockAlertRepo } from './stock-alert/stock-alert.repo'
import { initStockAlertRoute } from './stock-alert/stock-alert.route'
import { StockAlertService } from './stock-alert/stock-alert.service'
import { StockDashboardRepo } from './stock-dashboard/stock-dashboard.repo'
import { initStockDashboardRoute } from './stock-dashboard/stock-dashboard.route'
import { StockDashboardService } from './stock-dashboard/stock-dashboard.service'
import { StockSummaryRepo } from './stock-summary/stock-summary.repo'
import { initStockSummaryRoute } from './stock-summary/stock-summary.route'
import { StockSummaryService } from './stock-summary/stock-summary.service'
import { StockTransactionRepo } from './stock-transaction/stock-transaction.repo'
import { initStockTransactionRoute } from './stock-transaction/stock-transaction.route'
import { StockTransactionService } from './stock-transaction/stock-transaction.service'

export class InventoryServiceModule {
	public readonly transaction: StockTransactionService
	public readonly summary: StockSummaryService
	public readonly alert: StockAlertService
	public readonly dashboard: StockDashboardService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
		materialServiceModule: MaterialServiceModule,
	) {
		const transactionRepo = new StockTransactionRepo(this.db, this.cacheClient)
		const summaryRepo = new StockSummaryRepo(this.db, this.cacheClient)
		const alertRepo = new StockAlertRepo(this.db, this.cacheClient)
		const dashboardRepo = new StockDashboardRepo(this.db, this.cacheClient)

		this.transaction = new StockTransactionService(materialServiceModule.location, transactionRepo)
		this.summary = new StockSummaryService(summaryRepo, materialServiceModule.location)
		this.alert = new StockAlertService(alertRepo)
		this.dashboard = new StockDashboardService(dashboardRepo)
	}
}

export function initInventoryRouteModule(s: InventoryServiceModule) {
	return new Elysia({ prefix: '/inventory' })
		.use(initStockTransactionRoute(s.transaction))
		.use(initStockSummaryRoute(s.summary))
		.use(initStockAlertRoute(s.alert))
		.use(initStockDashboardRoute(s.dashboard))
}

// Feature exports - Stock Transaction
export * from './stock-transaction/stock-transaction.dto'
export * from './stock-transaction/stock-transaction.repo'
export * from './stock-transaction/stock-transaction.service'
export * from './stock-transaction/stock-transaction.route'

// Feature exports - Stock Summary
export * from './stock-summary/stock-summary.dto'
export * from './stock-summary/stock-summary.repo'
export * from './stock-summary/stock-summary.service'
export * from './stock-summary/stock-summary.route'

// Feature exports - Stock Alert
export * from './stock-alert/stock-alert.dto'
export * from './stock-alert/stock-alert.repo'
export * from './stock-alert/stock-alert.service'
export * from './stock-alert/stock-alert.route'

// Feature exports - Stock Dashboard
export * from './stock-dashboard/stock-dashboard.dto'
export * from './stock-dashboard/stock-dashboard.repo'
export * from './stock-dashboard/stock-dashboard.service'
export * from './stock-dashboard/stock-dashboard.route'

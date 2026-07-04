import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { StockDashboardRepo } from './stock-dashboard.repo'
import { StockDashboardService } from './stock-dashboard.service'

export type StockDashboardModule = StockDashboardService

export function createStockDashboardModule(db: DbContext, cacheClient: CacheClient): StockDashboardModule {
	const repo = new StockDashboardRepo(db)
	const dashboard = new StockDashboardService(repo, cacheClient)

	return dashboard
}

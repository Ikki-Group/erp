import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { StockAlertRepo } from './stock-alert.repo'
import { StockAlertService } from './stock-alert.service'

export type StockAlertModule = StockAlertService

export function createStockAlertModule(db: DbContext, cacheClient: CacheClient): StockAlertModule {
	const repo = new StockAlertRepo(db)
	const service = new StockAlertService(repo, cacheClient)
	return service
}

import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import type { MaterialLocationService } from '@/modules/material'

import { StockSummaryRepo } from './stock-summary.repo'
import { StockSummaryService } from './stock-summary.service'

export type StockSummaryModule = StockSummaryService

export interface StockSummaryModuleDeps {
	location: MaterialLocationService
}

export function createStockSummaryModule(
	db: DbContext,
	cacheClient: CacheClient,
	deps: StockSummaryModuleDeps,
): StockSummaryModule {
	const repo = new StockSummaryRepo(db)
	return new StockSummaryService(repo, deps.location, cacheClient)
}

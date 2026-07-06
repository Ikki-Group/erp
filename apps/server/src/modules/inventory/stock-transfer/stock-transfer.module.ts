import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { StockTransferRepo } from './stock-transfer.repo'
import { StockTransferService } from './stock-transfer.service'

export type StockTransferModule = StockTransferService

export function createStockTransferModule(
	db: DbContext,
	cacheClient: CacheClient,
): StockTransferModule {
	const repo = new StockTransferRepo(db)
	return new StockTransferService(repo, cacheClient)
}

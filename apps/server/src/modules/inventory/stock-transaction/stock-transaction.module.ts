import type { DbContext } from '@/infra/database'

import { StockTransactionRepo } from './stock-transaction.repo'
import { StockTransactionService, type MaterialLocationPort } from './stock-transaction.service'

export type StockTransactionModule = StockTransactionService

export interface StockTransactionModuleDeps {
	location: MaterialLocationPort
}

export function createStockTransactionModule(
	db: DbContext,
	deps: StockTransactionModuleDeps,
): StockTransactionModule {
	const repo = new StockTransactionRepo(db)
	return new StockTransactionService(deps.location, repo)
}

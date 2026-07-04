import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import type { GoodsReceiptDeps } from './goods-receipt.service'
import { GoodsReceiptRepo } from './goods-receipt.repo'
import { GoodsReceiptService } from './goods-receipt.service'

export type GoodsReceiptModule = GoodsReceiptService

export function createGoodsReceiptModule(
	db: DbContext,
	cacheClient: CacheClient,
	deps: GoodsReceiptDeps,
): GoodsReceiptModule {
	const repo = new GoodsReceiptRepo(db)
	const service = new GoodsReceiptService(deps, repo, cacheClient)
	return service
}

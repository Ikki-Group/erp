import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import type { PurchaseOrderDeps } from './purchase-order.service'
import { PurchaseOrderRepo } from './purchase-order.repo'
import { PurchaseOrderService } from './purchase-order.service'

export type PurchaseOrderModule = PurchaseOrderService

export function createPurchaseOrderModule(
	db: DbContext,
	cacheClient: CacheClient,
	deps: PurchaseOrderDeps,
): PurchaseOrderModule {
	const repo = new PurchaseOrderRepo(db)
	const service = new PurchaseOrderService(deps, repo, cacheClient)
	return service
}

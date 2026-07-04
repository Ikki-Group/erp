import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import type { LocationReadPort } from './sales-order.service'
import { SalesOrderRepo } from './sales-order.repo'
import { SalesOrderService, type CustomerReadPort, type ProductReadPort, type SalesTypeReadPort } from './sales-order.service'

export type SalesOrderModule = SalesOrderService

interface SalesOrderModuleDeps {
	location: LocationReadPort
	customer: CustomerReadPort
	salesType: SalesTypeReadPort
	product: ProductReadPort
}

export function createSalesOrderModule(
	db: DbContext,
	cacheClient: CacheClient,
	deps: SalesOrderModuleDeps,
): SalesOrderModule {
	const repo = new SalesOrderRepo(db)
	const service = new SalesOrderService(repo, cacheClient, deps)
	return service
}

import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { SalesOrderRepo } from './sales-order/sales-order.repo'
import { initSalesOrderRoute } from './sales-order/sales-order.route'
import { SalesOrderService } from './sales-order/sales-order.service'

export class SalesServiceModule {
	public readonly order: SalesOrderService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {
		const salesOrderRepo = new SalesOrderRepo(this.db, this.cacheClient)
		this.order = new SalesOrderService(salesOrderRepo)
	}
}

export function initSalesRouteModule(s: SalesServiceModule) {
	return new Elysia({ prefix: '/sales' }).use(initSalesOrderRoute(s.order))
}

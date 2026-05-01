import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { SalesOrderRepo } from './sales-order/sales-order.repo'
import { initSalesOrderRoute } from './sales-order/sales-order.route'
import { SalesOrderService } from './sales-order/sales-order.service'
import { SalesTypeRepo } from './sales-type/sales-type.repo'
import { initSalesTypeRoute } from './sales-type/sales-type.route'
import { SalesTypeService } from './sales-type/sales-type.service'

export class SalesServiceModule {
	public readonly order: SalesOrderService
	public readonly salesType: SalesTypeService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {
		const salesOrderRepo = new SalesOrderRepo(this.db, this.cacheClient)
		this.order = new SalesOrderService(salesOrderRepo)

		const salesTypeRepo = new SalesTypeRepo(this.db, this.cacheClient)
		this.salesType = new SalesTypeService(salesTypeRepo)
	}
}

export function initSalesRouteModule(s: SalesServiceModule) {
	return new Elysia({ prefix: '/sales' })
		.use(initSalesOrderRoute(s.order))
		.use(initSalesTypeRoute(s.salesType))
}

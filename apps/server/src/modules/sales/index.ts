import { Elysia } from 'elysia'

import { initSalesOrderRoute } from './sales-order/sales-order.route'
import { SalesOrderService } from './sales-order/sales-order.service'

export class SalesServiceModule {
	public readonly order: SalesOrderService

	constructor() {
		this.order = new SalesOrderService()
	}
}

export function initSalesRouteModule(s: SalesServiceModule) {
	return new Elysia({ prefix: '/sales' }).use(initSalesOrderRoute(s.order))
}

// Feature exports
export * from './sales-order/sales-order.dto'
export * from './sales-order/sales-order.repo'
export * from './sales-order/sales-order.service'
export * from './sales-order/sales-order.route'

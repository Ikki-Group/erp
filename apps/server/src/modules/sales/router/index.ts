import { Elysia } from 'elysia'

import type { SalesServiceModule } from '../service'
import { initSalesOrderRoute } from './sales-order.route'

export function initSalesRouteModule(s: SalesServiceModule) {
	return new Elysia({ prefix: '/sales' }).use(initSalesOrderRoute(s))
}

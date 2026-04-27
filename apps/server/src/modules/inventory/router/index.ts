import Elysia from 'elysia'

import type { InventoryServiceModule } from '../service'
import { initStockAlertRoute } from './stock-alert.route'
import { initStockDashboardRoute } from './stock-dashboard.route'
import { initStockSummaryRoute } from './stock-summary.route'
import { initStockTransactionRoute } from './stock-transaction.route'

export function initInventoryRouteModule(s: InventoryServiceModule) {
	return new Elysia({ prefix: '/inventory' })
		.use(initStockTransactionRoute(s))
		.use(initStockSummaryRoute(s))
		.use(initStockAlertRoute(s))
		.use(initStockDashboardRoute(s))
}

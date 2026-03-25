import Elysia from 'elysia'

import type { InventoryServiceModule } from '../service'
import { initStockSummaryRoute } from './stock-summary.route'
import { initStockTransactionRoute } from './stock-transaction.route'

export function initInventoryRouteModule(service: InventoryServiceModule) {
  const transactionRouter = initStockTransactionRoute(service)
  const summaryRouter = initStockSummaryRoute(service)

  return new Elysia({ prefix: '/inventory' }).use(transactionRouter).use(summaryRouter)
}

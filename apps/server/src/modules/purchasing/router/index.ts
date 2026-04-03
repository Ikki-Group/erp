import Elysia from 'elysia'

import type { PurchasingServiceModule } from '../service'
import { initPurchaseOrderRoute } from './purchase-order.route'

export function initPurchasingRouteModule(service: PurchasingServiceModule) {
  const purchaseOrderRouter = initPurchaseOrderRoute(service.purchaseOrder)

  return new Elysia({ prefix: '/purchasing' }).use(purchaseOrderRouter)
}

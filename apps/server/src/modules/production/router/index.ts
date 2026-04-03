import { Elysia } from 'elysia'

import type { ProductionServiceModule } from '../service'
import { workOrderRouter } from './work-order.route'

export function initProductionRouteModule(service: ProductionServiceModule) {
  const productionRouter = new Elysia({ prefix: '/production' })
    .use(workOrderRouter(service.workOrder))
  
  return productionRouter
}

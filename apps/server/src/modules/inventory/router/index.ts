import Elysia from 'elysia'

import type { InventoryServiceModule } from '../service'

import { buildItemCategoryRoute } from './item-category.route'
import { buildItemLocationsRoute } from './item-locations.route'
import { buildItemRoute } from './item.route'

export function initInventoryRouteModule(serviceModule: InventoryServiceModule) {
  return new Elysia({ prefix: '/inventory' })
    .use(buildItemCategoryRoute(serviceModule.category))
    .use(buildItemRoute(serviceModule.item))
    .use(buildItemLocationsRoute(serviceModule.location))
}

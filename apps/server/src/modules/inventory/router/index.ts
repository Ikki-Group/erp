import Elysia from 'elysia'

import type { InventoryServiceModule } from '../service'

import { buildItemCategoryRoute } from './item-categories.route'
import { buildItemLocationsRoute } from './item-locations.route'
import { buildItemUnitConversionsRoute } from './item-unit-conversions.route'
import { buildItemsRoute } from './items.route'

export function initInventoryRouteModule(serviceModule: InventoryServiceModule) {
  return new Elysia({ prefix: '/inventory' })
    .use(buildItemCategoryRoute(serviceModule.category))
    .use(buildItemsRoute(serviceModule.item))
    .use(buildItemUnitConversionsRoute(serviceModule.unitConversion))
    .use(buildItemLocationsRoute(serviceModule.location))
}

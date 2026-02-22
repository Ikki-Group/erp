import Elysia from 'elysia'

import type { InventoryServiceModule } from '../service'

import { buildItemCategoriesRoute } from './item-categories.route'
import { buildItemLocationsRoute } from './item-locations.route'
import { buildItemUnitConversionsRoute } from './item-unit-conversions.route'
import { buildItemsRoute } from './items.route'

export function initInventoryRouteModule(serviceModule: InventoryServiceModule) {
  return new Elysia({ prefix: '/inventory' })
    .use(buildItemCategoriesRoute(serviceModule.categories))
    .use(buildItemsRoute(serviceModule.items))
    .use(buildItemUnitConversionsRoute(serviceModule.unitConversions))
    .use(buildItemLocationsRoute(serviceModule.locations))
}

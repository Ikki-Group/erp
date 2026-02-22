import type { Elysia } from 'elysia'

import { buildItemCategoriesRoute } from './router/item-categories.route'
import { buildItemLocationsRoute } from './router/item-locations.route'
import { buildItemUnitConversionsRoute } from './router/item-unit-conversions.route'
import { buildItemsRoute } from './router/items.route'
import { ItemCategoriesService } from './service/item-category.service'
import { ItemLocationsService } from './service/item-locations.service'
import { ItemUnitConversionsService } from './service/item-unit-conversions.service'
import { ItemsService } from './service/item.service'

/**
 * Service factory for the Inventory module
 */
export class InventoryServiceModule {
  public categories: ItemCategoriesService
  public items: ItemsService
  public unitConversions: ItemUnitConversionsService
  public locations: ItemLocationsService

  constructor() {
    this.categories = new ItemCategoriesService()
    this.items = new ItemsService()
    this.unitConversions = new ItemUnitConversionsService()
    this.locations = new ItemLocationsService()
  }
}

/**
 * Main router factory for the Inventory module
 */
export function initInventoryRouteModule(services: InventoryServiceModule) {
  return (app: Elysia) =>
    app.group('/inventory', (app) =>
      app
        .use(buildItemCategoriesRoute(services.categories))
        .use(buildItemsRoute(services.items))
        .use(buildItemUnitConversionsRoute(services.unitConversions))
        .use(buildItemLocationsRoute(services.locations))
    )
}

export * from './inventory.types'

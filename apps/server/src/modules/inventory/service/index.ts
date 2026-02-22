import { ItemCategoryService } from './item-category.service'
import { ItemLocationsService } from './item-locations.service'
import { ItemUnitConversionsService } from './item-unit-conversions.service'
import { ItemService } from './item.service'

export class InventoryServiceModule {
  public category: ItemCategoryService
  public item: ItemService
  public unitConversion: ItemUnitConversionsService
  public location: ItemLocationsService

  constructor() {
    this.category = new ItemCategoryService()
    this.item = new ItemService()
    this.unitConversion = new ItemUnitConversionsService()
    this.location = new ItemLocationsService()
  }
}

export { ItemCategoryService } from './item-category.service'
export { ItemLocationsService } from './item-locations.service'
export { ItemUnitConversionsService } from './item-unit-conversions.service'
export { ItemService } from './item.service'

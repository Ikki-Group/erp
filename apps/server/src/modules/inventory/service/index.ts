import { ItemCategoryService } from './item-category.service'

export class InventoryServiceModule {
  itemCategoryService: ItemCategoryService

  constructor() {
    this.itemCategoryService = new ItemCategoryService()
  }
}

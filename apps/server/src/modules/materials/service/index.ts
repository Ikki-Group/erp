import { MaterialCategoryService } from './material-category.service'

export class MaterialServiceModule {
  public readonly category: MaterialCategoryService

  constructor() {
    this.category = new MaterialCategoryService()
  }
}

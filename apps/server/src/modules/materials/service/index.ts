import { MaterialCategoryService } from './material-category.service'
import { UomService } from './uom.service'

export class MaterialServiceModule {
  public readonly category: MaterialCategoryService
  public readonly uom: UomService

  constructor() {
    this.category = new MaterialCategoryService()
    this.uom = new UomService()
  }
}

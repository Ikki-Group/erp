import { MaterialCategoryService } from './material-category.service'
import { MaterialService } from './material.service'
import { UomService } from './uom.service'

export class MaterialServiceModule {
  public readonly category: MaterialCategoryService
  public readonly uom: UomService
  public readonly material: MaterialService

  constructor() {
    this.category = new MaterialCategoryService()
    this.uom = new UomService()
    this.material = new MaterialService(this.category)
  }
}

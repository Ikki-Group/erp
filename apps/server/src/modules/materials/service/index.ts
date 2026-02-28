import { MaterialCategoryService } from './material-category.service'
import { MaterialUomService } from './material-uom.service'
import { MaterialService } from './material.service'
import { UomService } from './uom.service'

export class MaterialServiceModule {
  public readonly materialUom: MaterialUomService
  public readonly category: MaterialCategoryService
  public readonly material: MaterialService
  public readonly uom: UomService

  constructor() {
    this.materialUom = new MaterialUomService()
    this.category = new MaterialCategoryService()
    this.material = new MaterialService(this.materialUom)
    this.uom = new UomService()
  }
}

export * from './material-category.service'
export * from './material-uom.service'
export * from './material.service'
export * from './uom.service'

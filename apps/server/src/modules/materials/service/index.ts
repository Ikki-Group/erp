import { MaterialCategoryService } from './material-category.service'
import { MaterialUomService } from './material-uom.service'
import { MaterialService } from './material.service'
import { UomService } from './uom.service'

export class MaterialServiceModule {
  constructor(
    public readonly materialUom: MaterialUomService = new MaterialUomService(),
    public readonly category: MaterialCategoryService = new MaterialCategoryService(),
    public readonly material: MaterialService = new MaterialService(),
    public readonly uom: UomService = new UomService()
  ) {}
}

export * from './material-category.service'
export * from './material-uom.service'
export * from './material.service'
export * from './uom.service'

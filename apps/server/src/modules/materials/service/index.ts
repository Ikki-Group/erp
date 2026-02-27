import { MaterialCategoryService } from './material-category.service'
import { MaterialService } from './material.service'
import { UomService } from './uom.service'

export class MaterialServiceModule {
  constructor(
    public readonly category: MaterialCategoryService = new MaterialCategoryService(),
    public readonly material: MaterialService = new MaterialService(),
    public readonly uom: UomService = new UomService()
  ) {}
}

export * from './material-category.service'
export * from './material.service'
export * from './uom.service'

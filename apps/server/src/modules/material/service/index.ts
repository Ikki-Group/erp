import type { LocationServiceModule } from '@/modules/location/service'

import { MaterialCategoryService } from './material-category.service'
import { MaterialLocationService } from './material-location.service'
import { MaterialService } from './material.service'
import { UomService } from './uom.service'

export class MaterialServiceModule {
  public readonly category: MaterialCategoryService
  public readonly uom: UomService
  public readonly material: MaterialService
  public readonly mLocation: MaterialLocationService

  constructor(locationServiceModule: LocationServiceModule) {
    this.category = new MaterialCategoryService()
    this.uom = new UomService()
    this.material = new MaterialService(this.category, this.uom, locationServiceModule.location)
    this.mLocation = new MaterialLocationService(this.material, locationServiceModule)
  }
}

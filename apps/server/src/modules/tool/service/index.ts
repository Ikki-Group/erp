import type { IamServiceModule } from '@/modules/iam'
import type { LocationServiceModule } from '@/modules/location'
import type { ProductServiceModule } from '@/modules/product'

import { SeedService } from './seed.service'

export class ToolServiceModule {
  public readonly seed: SeedService

  constructor(iamSvc: IamServiceModule, locationSvc: LocationServiceModule, productSvc: ProductServiceModule) {
    this.seed = new SeedService(iamSvc, locationSvc, productSvc)
  }
}

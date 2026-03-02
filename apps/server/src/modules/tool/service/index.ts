import type { IamServiceModule } from '@/modules/iam'
import type { LocationServiceModule } from '@/modules/location'

import { SeedService } from './seed.service'

export class ToolServiceModule {
  public readonly seed: SeedService

  constructor(iamSvc: IamServiceModule, locationSvc: LocationServiceModule) {
    this.seed = new SeedService(iamSvc, locationSvc)
  }
}

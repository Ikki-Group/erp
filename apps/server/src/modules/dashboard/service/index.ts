import type { IamServiceModule } from '@/modules/iam/service'
import type { LocationServiceModule } from '@/modules/location/service'

import { SettingsService } from './settings.service'

export class DashboardServiceModule {
  public settings: SettingsService

  constructor(iam: IamServiceModule, location: LocationServiceModule) {
    this.settings = new SettingsService(iam, location)
  }
}

import type { IamServiceModule } from '@/modules/iam'
import type { LocationServiceModule } from '@/modules/location'

import { SettingsService } from './settings.service'

export class DashboardServiceModule {
  public settings: SettingsService

  constructor(
    private readonly iam: IamServiceModule,
    private readonly location: LocationServiceModule
  ) {
    this.settings = new SettingsService(iam, location)
  }
}

export { SettingsService } from './settings.service'

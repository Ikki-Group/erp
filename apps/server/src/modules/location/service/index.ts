import { LocationService } from './location.service'

export class LocationServiceModule {
  public location: LocationService

  constructor() {
    this.location = new LocationService()
  }
}

export type { LocationService } from './location.service'

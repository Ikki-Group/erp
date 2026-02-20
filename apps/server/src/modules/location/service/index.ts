import { LocationsService } from './location.service'

export class LocationServiceModule {
  constructor(public readonly locations: LocationsService = new LocationsService()) {}
}

export { LocationsService } from './location.service'

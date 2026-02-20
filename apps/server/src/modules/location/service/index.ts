import { LocationService } from './location.service'

export class LocationServiceModule {
  constructor(public readonly location: LocationService = new LocationService()) {}
}

export { LocationService } from './location.service'

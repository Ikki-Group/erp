import { LocationsService } from './locations.service'

export class LocationsModuleService {
  constructor(public readonly locations: LocationsService = new LocationsService()) {}
}

export { LocationsService } from './locations.service'

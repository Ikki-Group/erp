import { LocationMasterService } from './location-master.service'

export class LocationServiceModule {
	public location: LocationMasterService

	constructor() {
		this.location = new LocationMasterService()
	}
}

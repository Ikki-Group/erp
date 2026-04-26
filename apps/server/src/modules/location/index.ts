import { Elysia } from 'elysia'

import { initLocationRoute } from './location-master/location-master.route'
import { LocationMasterService } from './location-master/location-master.service'

export class LocationServiceModule {
	public location: LocationMasterService

	constructor() {
		this.location = new LocationMasterService()
	}
}

export function initLocationRouteModule(service: LocationServiceModule) {
	const locationRouter = initLocationRoute(service.location)

	return new Elysia({ prefix: '/location' }).use(locationRouter)
}

export * from './location-master/location-master.dto'
export * from './location-master/location-master.repo'
export * from './location-master/location-master.service'

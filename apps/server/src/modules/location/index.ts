import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { LocationMasterRepo } from './location-master/location-master.repo'
import { initLocationRoute } from './location-master/location-master.route'
import { LocationMasterService } from './location-master/location-master.service'

export class LocationServiceModule {
	public readonly master: LocationMasterService

	constructor(db: DbClient, cacheClient: CacheClient) {
		const repo = new LocationMasterRepo(db, cacheClient)
		this.master = new LocationMasterService(repo)
	}
}

export function initLocationRouteModule(service: LocationServiceModule) {
	const locationRouter = initLocationRoute(service.master)

	return new Elysia({ prefix: '/location' }).use(locationRouter)
}

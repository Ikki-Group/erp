import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { LocationMasterRepo } from './location.repo'
import { initLocationRoute } from './location.route'
import { LocationMasterService } from './location.service'

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

export { LocationDto } from './location.dto'
export { LocationMasterService } from './location.service'

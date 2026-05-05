import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { LocationMasterRepo } from './location.repo'
import { initLocationRoute } from './location.route'
import { LocationMasterService } from './location.service'

export class LocationServiceModule {
	public readonly master: LocationMasterService

	constructor(db: DbClient, cacheClient: CacheClient) {
		const repo = new LocationMasterRepo(db)
		this.master = new LocationMasterService(repo, cacheClient)
	}
}

export function initLocationRouteModule(service: LocationServiceModule) {
	const locationRouter = initLocationRoute(service.master)

	return new Elysia({ prefix: '/location' }).use(locationRouter)
}

export {
	LocationDto,
	LocationCreateDto,
	LocationUpdateDto,
	LocationFilterDto,
	LocationTypeDto,
	type LocationTypeDto as LocationTypeDtoType,
} from './location.dto'
export { LocationMasterService } from './location.service'

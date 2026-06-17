import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { LocationRepo } from './location.repo'
import { LocationService } from './location.service'

export type LocationModule = LocationService

export function createLocationModule(db: DbContext, cacheClient: CacheClient): LocationModule {
	const repo = new LocationRepo(db)
	const location = new LocationService(repo, cacheClient)

	return location
}

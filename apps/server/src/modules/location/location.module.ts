import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import { LocationRepo } from './location.repo'
import { LocationService } from './location.service'

export type LocationModule = LocationService

export function createLocationModule(db: DbClient, cacheClient: CacheClient): LocationModule {
	const repo = new LocationRepo(db)
	const location = new LocationService(repo, cacheClient)

	return location
}

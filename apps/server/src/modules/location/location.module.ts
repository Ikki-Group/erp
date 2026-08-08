import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import { LocationRepo } from './location.repo.ts'
import { LocationService } from './location.service.ts'
import { createLocationRoute } from './location.route.ts'

export function createLocationModule(db: DbContext, cacheClient: CacheClient) {
	const repo = new LocationRepo(db)
	const service = new LocationService(repo, cacheClient)
	const route = createLocationRoute(service)
	return { route, service }
}

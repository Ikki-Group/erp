import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import { LocationRepo } from './location.repo'
import { LocationService } from './location.service'

interface LocationModule

export class LocationModule {
	public readonly location: LocationService

	constructor(db: DbClient, cacheClient: CacheClient) {
		const repo = new LocationRepo(db)
		this.location = new LocationService(repo, cacheClient)
	}
}

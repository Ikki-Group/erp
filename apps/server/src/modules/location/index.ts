import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { LocationRepo } from './location.repo'
import { createLocationRoute } from './location.route'
import { LocationService } from './location.service'

export class LocationServiceModule {
	public readonly location: LocationService

	constructor(db: DbClient, cacheClient: CacheClient) {
		const repo = new LocationRepo(db)
		this.location = new LocationService(repo, cacheClient)
	}
}

export function createLocationRouteModule(s: LocationServiceModule) {
	return new Elysia({ prefix: '/location' }).use(createLocationRoute(s.location))
}

export * from './location.schema'
export type { LocationService } from './location.service'

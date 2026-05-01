import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { SalesTypeRepo } from './sales-type.repo'
import { initSalesTypeRoute } from './sales-type.route'
import { SalesTypeService } from './sales-type.service'

export class SalesTypeServiceModule {
	public readonly service: SalesTypeService

	constructor(db: DbClient, cacheClient: CacheClient) {
		const salesTypeRepo = new SalesTypeRepo(db, cacheClient)
		this.service = new SalesTypeService(salesTypeRepo)
	}
}

export function initSalesTypeRouteModule(s: SalesTypeServiceModule) {
	return new Elysia({ prefix: '/sales-type' }).use(initSalesTypeRoute(s.service))
}

export type { SalesTypeService } from './sales-type.service'

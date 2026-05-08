import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { SalesTypeRepo } from './sales-type.repo'
import { initSalesTypeRoute } from './sales-type.route'
import { SalesTypeService } from './sales-type.service'

export class SalesTypeServiceModule {
	public readonly salesType: SalesTypeService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {
		const salesTypeRepo = new SalesTypeRepo(this.db)
		this.salesType = new SalesTypeService(salesTypeRepo, this.cacheClient)
	}
}

export function initSalesTypeRouteModule(s: SalesTypeServiceModule) {
	return new Elysia({ prefix: '/sales-type' }).use(initSalesTypeRoute(s.salesType))
}

export * from './sales-type.dto'
export type { SalesTypeService } from './sales-type.service'

import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import type {
	SalesTypeDto,
	SalesTypeFilterDto,
	SalesTypeCreateDto,
	SalesTypeUpdateDto,
} from './sales-type.contract'
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

export type SalesTypeModule = SalesTypeServiceModule

export function initSalesTypeRouteModule(s: SalesTypeServiceModule) {
	return new Elysia().use(initSalesTypeRoute(s.salesType))
}

export type { SalesTypeDto, SalesTypeFilterDto, SalesTypeCreateDto, SalesTypeUpdateDto }
export type { SalesTypeService } from './sales-type.service'

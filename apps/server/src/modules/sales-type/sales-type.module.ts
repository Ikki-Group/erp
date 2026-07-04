import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { SalesTypeRepo } from './sales-type.repo'
import { SalesTypeService } from './sales-type.service'

export type SalesTypeModule = SalesTypeService

export function createSalesTypeModule(db: DbContext, cacheClient: CacheClient): SalesTypeModule {
	const repo = new SalesTypeRepo(db)
	const salesType = new SalesTypeService(repo, cacheClient)

	return salesType
}

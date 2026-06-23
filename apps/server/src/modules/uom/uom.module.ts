import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { UomRepo } from './uom.repo'
import { UomService } from './uom.service'

export interface UomModule {
	uom: UomService
}

export function createUomModule(db: DbContext, cacheClient: CacheClient): UomModule {
	const repo = new UomRepo(db)
	const service = new UomService(repo, cacheClient)

	return {
		uom: service,
	}
}

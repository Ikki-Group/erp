import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { UomRepo } from './uom.repo'
import { UomService } from './uom.service'

export type UomModule = UomService

export function createUomModule(db: DbContext, cacheClient: CacheClient): UomModule {
	const repo = new UomRepo(db)
	const uom = new UomService(repo, cacheClient)

	return uom
}

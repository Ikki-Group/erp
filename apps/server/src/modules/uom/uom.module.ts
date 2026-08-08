import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import { UomRepo } from './uom.repo.ts'
import { UomService } from './uom.service.ts'
import { createUomRoute } from './uom.route.ts'

export function createUomModule(db: DbContext, cacheClient: CacheClient) {
	const repo = new UomRepo(db)
	const service = new UomService(repo, cacheClient)
	const route = createUomRoute(service)
	return { route, service }
}

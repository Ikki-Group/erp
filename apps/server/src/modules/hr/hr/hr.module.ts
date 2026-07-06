import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import { HRRepo } from './hr.repo'
import { HRService } from './hr.service'

export type HRModule = HRService

export function createHRModule(db: DbClient, cacheClient: CacheClient): HRModule {
	const repo = new HRRepo(db)
	return new HRService(repo, cacheClient)
}

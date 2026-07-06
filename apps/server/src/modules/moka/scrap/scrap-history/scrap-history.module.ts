import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import { MokaScrapHistoryRepo } from './scrap-history.repo'
import { MokaScrapHistoryService } from './scrap-history.service'

export type MokaScrapHistoryModule = MokaScrapHistoryService

export function createMokaScrapHistoryModule(db: DbClient, cacheClient: CacheClient): MokaScrapHistoryModule {
	const repo = new MokaScrapHistoryRepo(db)
	return new MokaScrapHistoryService(repo, cacheClient)
}

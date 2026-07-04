import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { AnalyticsRepo } from './analytics.repo'
import { AnalyticsService } from './analytics.service'

export type AnalyticsModule = AnalyticsService

export function createAnalyticsModule(db: DbContext, cacheClient: CacheClient): AnalyticsModule {
	const repo = new AnalyticsRepo(db)
	const analytics = new AnalyticsService(repo, cacheClient)

	return analytics
}

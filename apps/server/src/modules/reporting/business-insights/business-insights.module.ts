import type { DbContext } from '@/infra/database'

import { BusinessInsightsRepo } from './business-insights.repo'
import { BusinessInsightsService } from './business-insights.service'

export type BusinessInsightsModule = BusinessInsightsService

export function createBusinessInsightsModule(db: DbContext): BusinessInsightsModule {
	const repo = new BusinessInsightsRepo(db)
	const service = new BusinessInsightsService(repo)

	return service
}

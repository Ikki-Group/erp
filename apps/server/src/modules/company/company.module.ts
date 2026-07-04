import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { CompanySettingsRepo } from './company-settings.repo'
import { CompanySettingsService } from './company-settings.service'

export type CompanyModule = {
	settings: CompanySettingsService
}

export function createCompanyModule(db: DbContext, cacheClient: CacheClient): CompanyModule {
	const repo = new CompanySettingsRepo(db)
	const settings = new CompanySettingsService(repo, cacheClient)

	return { settings }
}

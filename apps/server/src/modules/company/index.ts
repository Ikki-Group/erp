import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { CompanySettingsRepo } from './settings/company-settings.repo'
import { initCompanySettingsRoute } from './settings/company-settings.route'
import { CompanySettingsService } from './settings/company-settings.service'

export class CompanyServiceModule {
	public readonly settings: CompanySettingsService

	constructor(db: DbClient, cacheClient: CacheClient) {
		const repo = new CompanySettingsRepo(db, cacheClient)
		this.settings = new CompanySettingsService(repo)
	}
}

export function initCompanyRouteModule(service: CompanyServiceModule) {
	const settingsRouter = initCompanySettingsRoute(service.settings)

	return new Elysia({ prefix: '/company' }).use(settingsRouter)
}

export { CompanySettingsDto } from './settings/company-settings.dto'
export { CompanySettingsService } from './settings/company-settings.service'

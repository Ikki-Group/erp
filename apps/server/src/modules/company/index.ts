import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { CompanySettingsRepo } from './company-settings.repo'
import { initCompanySettingsRoute } from './company-settings.route'
import { CompanySettingsService } from './company-settings.service'

export class CompanyServiceModule {
	public readonly settings: CompanySettingsService

	constructor(db: DbClient, cacheClient: CacheClient) {
		const repo = new CompanySettingsRepo(db)
		this.settings = new CompanySettingsService(repo, cacheClient)
	}
}

export function initCompanyRouteModule(service: CompanyServiceModule) {
	const settingsRouter = initCompanySettingsRoute(service.settings)

	return new Elysia({ prefix: '/company' }).use(settingsRouter)
}

export { CompanySettingsDto } from './company-settings.dto'
export { CompanySettingsService } from './company-settings.service'

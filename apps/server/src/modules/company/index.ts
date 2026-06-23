import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'

import type { DbClient } from '@/infra/database'

import { CompanySettingsRepo } from './company-settings.repo'
import { initCompanySettingsRoute } from './company-settings.route'
import type {
	CompanySettingsDto,
	CompanySettingsCreateDto,
	CompanySettingsUpdateDto,
} from './company-settings.schema'
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

export type { CompanySettingsDto, CompanySettingsCreateDto, CompanySettingsUpdateDto }
export type { CompanySettingsService } from './company-settings.service'

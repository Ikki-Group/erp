import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import { CompanyRepo } from './company.repo.ts'
import { CompanyService } from './company.service.ts'
import { createCompanyRoute } from './company.route.ts'

export function createCompanyModule(db: DbContext, cacheClient: CacheClient) {
	const repo = new CompanyRepo(db)
	const service = new CompanyService(repo, cacheClient)
	const route = createCompanyRoute(service)
	return { route, service }
}

import type { Infra } from '@/shared/module.ts'

import { CompanyRepo } from './company.repo.ts'
import { createCompanyRoute } from './company.route.ts'
import { CompanyService } from './company.service.ts'

export function createCompanyModule(infra: Infra) {
	const service = new CompanyService({ ...infra, repo: new CompanyRepo(infra.db) })
	return { service, route: createCompanyRoute(service) }
}

export type { CompanyService }

import type { ModuleDescriptor } from '@/shared/module/registry.ts'

import { CompanyRepo } from './company.repo.ts'
import { createCompanyRoute } from './company.route.ts'
import { CompanyService } from './company.service.ts'

export interface CompanyApi extends Record<string, unknown> {
	taxRate: {
		getPercent(): Promise<number>
	}
}

export const companyModule: ModuleDescriptor = {
	name: 'company',
	layer: 0,
	dependsOn: [],
	create(ctx) {
		const service = new CompanyService({
			repo: new CompanyRepo(ctx.db),
			uow: ctx.uow,
			cache: ctx.cache,
			audit: ctx.auditPort,
		})
		const api: CompanyApi = {
			taxRate: { getPercent: () => service.getTaxRatePercent() },
		}
		return { route: createCompanyRoute(service), api }
	},
}

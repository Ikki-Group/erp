import type { ModuleDescriptor } from '@/shared/module/registry.ts'

import { createCompanyRepo } from './company.repo.ts'
import { createCompanyRoute } from './company.route.ts'
import { CompanyService } from './company.service.ts'
import { createOverviewRepo } from './overview/overview.repo.ts'
import { OverviewService } from './overview/overview.service.ts'

export interface CompanyApi extends Record<string, unknown> {
	taxRate: {
		getPercent(): Promise<string>
	}
}

export const companyModule: ModuleDescriptor = {
	name: 'company',
	layer: 0,
	dependsOn: [],
	create(ctx) {
		const service = new CompanyService({
			repo: createCompanyRepo(ctx.db),
			uow: ctx.uow,
			cache: ctx.cache,
			audit: ctx.auditPort,
		})
		const api: CompanyApi = {
			taxRate: { getPercent: () => service.getTaxRatePercent() },
		}
		// Business day follows the server TZ (see .env.example); Jakarta is the product default.
		const overview = new OverviewService(
			createOverviewRepo(ctx.db, process.env.TZ ?? 'Asia/Jakarta'),
		)
		return { route: createCompanyRoute(service, overview), api }
	},
}

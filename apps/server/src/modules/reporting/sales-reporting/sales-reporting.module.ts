import type { DbContext } from '@/infra/database'

import { SalesReportingRepo } from './sales-reporting.repo'
import { SalesReportingService } from './sales-reporting.service'

export type SalesReportingModule = SalesReportingService

export function createSalesReportingModule(db: DbContext): SalesReportingModule {
	const repo = new SalesReportingRepo(db)
	const service = new SalesReportingService(repo)

	return service
}

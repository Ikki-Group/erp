import type { DbContext } from '@/infra/database'

import { FinanceReportingRepo } from './finance-reporting.repo'
import { FinanceReportingService } from './finance-reporting.service'

export type FinanceReportingModule = FinanceReportingService

export function createFinanceReportingModule(db: DbContext): FinanceReportingModule {
	const repo = new FinanceReportingRepo(db)
	const service = new FinanceReportingService(repo)

	return service
}

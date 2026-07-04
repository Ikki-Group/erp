import type { DbContext } from '@/infra/database'

import { ProcurementReportingRepo } from './procurement-reporting.repo'
import { ProcurementReportingService } from './procurement-reporting.service'

export type ProcurementReportingModule = ProcurementReportingService

export function createProcurementReportingModule(db: DbContext): ProcurementReportingModule {
	const repo = new ProcurementReportingRepo(db)
	const service = new ProcurementReportingService(repo)

	return service
}

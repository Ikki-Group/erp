import type { DbContext } from '@/infra/database'

import { CrmReportingRepo } from './crm-reporting.repo'
import { CrmReportingService } from './crm-reporting.service'

export type CrmReportingModule = CrmReportingService

export function createCrmReportingModule(db: DbContext): CrmReportingModule {
	const repo = new CrmReportingRepo(db)
	const service = new CrmReportingService(repo)

	return service
}

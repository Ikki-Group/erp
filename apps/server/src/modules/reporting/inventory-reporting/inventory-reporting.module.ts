import type { DbContext } from '@/infra/database'

import { InventoryReportingRepo } from './inventory-reporting.repo'
import { InventoryReportingService } from './inventory-reporting.service'

export type InventoryReportingModule = InventoryReportingService

export function createInventoryReportingModule(db: DbContext): InventoryReportingModule {
	const repo = new InventoryReportingRepo(db)
	const service = new InventoryReportingService(repo)

	return service
}

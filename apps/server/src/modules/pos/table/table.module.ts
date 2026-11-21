import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

import type { LocationService } from '@/modules/location/location.service.ts'

import { TableRepo } from './table.repo.ts'
import { createTableRoute } from './table.route.ts'
import { TableService } from './table.service.ts'

// ─── Dependencies ───

export interface TableModuleDeps {
	locationService: LocationService
	uow: UnitOfWork
	audit: AuditPort
}

// ─── Module Factory ───

export function createTableModule(db: DbContext, cacheClient: CacheClient, deps: TableModuleDeps) {
	const repo = new TableRepo(db)
	const service = new TableService(repo, cacheClient, deps.locationService, deps.uow, deps.audit)
	const route = createTableRoute(service)
	return { route, service }
}

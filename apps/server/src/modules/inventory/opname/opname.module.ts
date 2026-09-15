import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { EventBusPort } from '@/shared/events/event-bus.port.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

import type { StockService } from '@/modules/inventory/stock/stock.service.ts'
import type { LocationService } from '@/modules/location/location.service.ts'
import type { AssignmentService } from '@/modules/material/assignment/assignment.service.ts'

import { OpnameRepo } from './opname.repo.ts'
import { createOpnameRoute } from './opname.route.ts'
import { OpnameService } from './opname.service.ts'

// ─── Dependencies ───

export interface OpnameModuleDeps {
	uow: UnitOfWork
	audit: AuditPort
	events: EventBusPort
	stockService: StockService
	assignmentService: AssignmentService
	locationService: LocationService
}

// ─── Module Factory ───

export function createOpnameModule(
	db: DbContext,
	cacheClient: CacheClient,
	deps: OpnameModuleDeps,
) {
	const repo = new OpnameRepo(db)
	const service = new OpnameService(repo, cacheClient, {
		uow: deps.uow,
		audit: deps.audit,
		events: deps.events,
		stockService: deps.stockService,
		assignmentService: deps.assignmentService,
		locationService: deps.locationService,
	})
	const route = createOpnameRoute(service)
	return { route, service }
}

import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { EventBusPort } from '@/shared/events/event-bus.port.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

import type { StockService } from '@/modules/inventory/stock/stock.service.ts'
import type { LocationService } from '@/modules/location/location.service.ts'
import type { AssignmentService } from '@/modules/material/assignment/assignment.service.ts'
import type { MaterialService } from '@/modules/material/material.service.ts'
import type { SupplierService } from '@/modules/supplier/supplier.service.ts'
import type { UomService } from '@/modules/uom/uom.service.ts'

import { ReceivingRepo } from './receiving.repo.ts'
import { createReceivingRoute } from './receiving.route.ts'
import { ReceivingService } from './receiving.service.ts'

// ─── Dependencies ───

export interface ReceivingModuleDeps {
	uow: UnitOfWork
	audit: AuditPort
	events: EventBusPort
	stockService: StockService
	assignmentService: AssignmentService
	locationService: LocationService
	materialService: MaterialService
	supplierService: SupplierService
	uomService: UomService
}

// ─── Module Factory ───

export function createReceivingModule(
	db: DbContext,
	cacheClient: CacheClient,
	deps: ReceivingModuleDeps,
) {
	const repo = new ReceivingRepo(db)
	const service = new ReceivingService(repo, cacheClient, {
		uow: deps.uow,
		audit: deps.audit,
		events: deps.events,
		stockService: deps.stockService,
		assignmentService: deps.assignmentService,
		locationService: deps.locationService,
		materialService: deps.materialService,
		supplierService: deps.supplierService,
		uomService: deps.uomService,
	})
	const route = createReceivingRoute(service)
	return { route, service }
}

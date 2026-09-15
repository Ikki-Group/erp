import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { EventBusPort } from '@/shared/events/event-bus.port.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

import type { InventoryApi } from '@/modules/inventory/index.ts'
import type { LocationService } from '@/modules/location/location.service.ts'
import type { MaterialService } from '@/modules/material/material.service.ts'
import type { UomService } from '@/modules/uom/uom.service.ts'

import { ProductionRepo } from './production.repo.ts'
import { createProductionRoute } from './production.route.ts'
import { ProductionService } from './production.service.ts'

// ─── Dependencies ───

export interface ProductionModuleDeps {
	uow: UnitOfWork
	audit: AuditPort
	events: EventBusPort
	inventoryApi: InventoryApi['stock']
	locationService: LocationService
	materialService: MaterialService
	uomService: UomService
}

// ─── Module Factory ───

export function createProductionModule(
	db: DbContext,
	cacheClient: CacheClient,
	deps: ProductionModuleDeps,
) {
	const repo = new ProductionRepo(db)
	const service = new ProductionService(repo, cacheClient, {
		uow: deps.uow,
		audit: deps.audit,
		events: deps.events,
		inventoryApi: deps.inventoryApi,
		locationService: deps.locationService,
		materialService: deps.materialService,
		uomService: deps.uomService,
	})
	const route = createProductionRoute(service)
	return { route, service }
}

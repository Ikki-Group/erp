import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

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

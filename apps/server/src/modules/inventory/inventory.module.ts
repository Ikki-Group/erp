import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import type { LocationService } from '@/modules/location/location.service.ts'
import type { AssignmentService } from '@/modules/material/assignment/assignment.service.ts'
import type { MaterialService } from '@/modules/material/material.service.ts'
import type { SupplierService } from '@/modules/supplier/supplier.service.ts'
import type { UomService } from '@/modules/uom/uom.service.ts'

import { createInventoryRoute } from './inventory.route.ts'
import { createOpnameModule } from './opname/opname.module.ts'
import { createReceivingModule } from './receiving/receiving.module.ts'
import { createStockModule } from './stock/stock.module.ts'
import { createTransferModule } from './transfer/transfer.module.ts'

// ─── Dependencies ───

export interface InventoryModuleDeps {
	assignmentService: AssignmentService
	locationService: LocationService
	materialService: MaterialService
	supplierService: SupplierService
	uomService: UomService
}

// ─── Module Factory ───

export function createInventoryModule(
	db: DbContext,
	cacheClient: CacheClient,
	deps: InventoryModuleDeps,
) {
	const stock = createStockModule(db, cacheClient, {
		assignmentService: deps.assignmentService,
	})
	const transfer = createTransferModule(db, cacheClient, {
		stockService: stock.service,
		assignmentService: deps.assignmentService,
		locationService: deps.locationService,
	})
	const receiving = createReceivingModule(db, cacheClient, {
		stockService: stock.service,
		assignmentService: deps.assignmentService,
		locationService: deps.locationService,
		materialService: deps.materialService,
		supplierService: deps.supplierService,
		uomService: deps.uomService,
	})
	const opname = createOpnameModule(db, cacheClient, {
		stockService: stock.service,
		assignmentService: deps.assignmentService,
		locationService: deps.locationService,
	})
	const route = createInventoryRoute({ stock, transfer, receiving, opname })
	return {
		route,
		stockService: stock.service,
		transferService: transfer.service,
		receivingService: receiving.service,
		opnameService: opname.service,
	}
}

import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import type { LocationService } from '@/modules/location/location.service.ts'
import type { AssignmentService } from '@/modules/material/assignment/assignment.service.ts'

import { createInventoryRoute } from './inventory.route.ts'
import { createStockModule } from './stock/stock.module.ts'
import { createTransferModule } from './transfer/transfer.module.ts'

// ─── Dependencies ───

export interface InventoryModuleDeps {
	assignmentService: AssignmentService
	locationService: LocationService
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
	const route = createInventoryRoute({ stock, transfer })
	return { route, stockService: stock.service, transferService: transfer.service }
}

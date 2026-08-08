import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import type { AssignmentService } from '@/modules/material/assignment/assignment.service.ts'

import { createInventoryRoute } from './inventory.route.ts'
import { createStockModule } from './stock/stock.module.ts'

// ─── Dependencies ───

export interface InventoryModuleDeps {
	assignmentService: AssignmentService
}

// ─── Module Factory ───

export function createInventoryModule(db: DbContext, cacheClient: CacheClient, deps: InventoryModuleDeps) {
	const stock = createStockModule(db, cacheClient, {
		assignmentService: deps.assignmentService,
	})
	const route = createInventoryRoute({ stock })
	return { route, stockService: stock.service }
}

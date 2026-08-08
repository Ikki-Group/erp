import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import type { StockService } from '@/modules/inventory/stock/stock.service.ts'
import type { LocationService } from '@/modules/location/location.service.ts'
import type { AssignmentService } from '@/modules/material/assignment/assignment.service.ts'

import { OpnameRepo } from './opname.repo.ts'
import { createOpnameRoute } from './opname.route.ts'
import { OpnameService } from './opname.service.ts'

// ─── Dependencies ───

export interface OpnameModuleDeps {
	stockService: StockService
	assignmentService: AssignmentService
	locationService: LocationService
}

// ─── Module Factory ───

export function createOpnameModule(db: DbContext, cacheClient: CacheClient, deps: OpnameModuleDeps) {
	const repo = new OpnameRepo(db)
	const service = new OpnameService(repo, cacheClient, {
		stockService: deps.stockService,
		assignmentService: deps.assignmentService,
		locationService: deps.locationService,
	})
	const route = createOpnameRoute(service)
	return { route, service }
}

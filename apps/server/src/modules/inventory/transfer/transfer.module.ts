import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import type { StockService } from '@/modules/inventory/stock/stock.service.ts'
import type { LocationService } from '@/modules/location/location.service.ts'
import type { AssignmentService } from '@/modules/material/assignment/assignment.service.ts'

import { TransferRepo } from './transfer.repo.ts'
import { createTransferRoute } from './transfer.route.ts'
import { TransferService } from './transfer.service.ts'

// ─── Dependencies ───

export interface TransferModuleDeps {
	stockService: StockService
	assignmentService: AssignmentService
	locationService: LocationService
}

// ─── Module Factory ───

export function createTransferModule(
	db: DbContext,
	cacheClient: CacheClient,
	deps: TransferModuleDeps,
) {
	const repo = new TransferRepo(db)
	const service = new TransferService(repo, cacheClient, {
		stockService: deps.stockService,
		assignmentService: deps.assignmentService,
		locationService: deps.locationService,
	})
	const route = createTransferRoute(service)
	return { route, service }
}

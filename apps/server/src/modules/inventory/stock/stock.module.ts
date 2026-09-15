import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { EventBusPort } from '@/shared/events/event-bus.port.ts'

import type { AssignmentService } from '@/modules/material/assignment/assignment.service.ts'

import { StockRepo } from './stock.repo.ts'
import { createStockRoute } from './stock.route.ts'
import { StockService } from './stock.service.ts'

// ─── Dependencies ───

export interface StockModuleDeps {
	assignmentService: AssignmentService
	events: EventBusPort
}

// ─── Module Factory ───

export function createStockModule(db: DbContext, cacheClient: CacheClient, deps: StockModuleDeps) {
	const repo = new StockRepo(db)
	const service = new StockService(repo, cacheClient, deps.assignmentService, deps.events)
	const route = createStockRoute(service)
	return { route, service }
}

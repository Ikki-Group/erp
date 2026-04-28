import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import type { InventoryServiceModule } from '@/modules/inventory'
import type { RecipeService } from '@/modules/recipe'

import { WorkOrderRepo } from './work-order/work-order.repo'
import { initWorkOrderRoute } from './work-order/work-order.route'
import { WorkOrderService } from './work-order/work-order.service'

export class ProductionServiceModule {
	public readonly workOrder: WorkOrderService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
		recipeSvc: RecipeService,
		inventorySvc: InventoryServiceModule,
	) {
		const workOrderRepo = new WorkOrderRepo(this.db, this.cacheClient)
		this.workOrder = new WorkOrderService(workOrderRepo, this.db, recipeSvc, inventorySvc)
	}
}

export function initProductionRouteModule(s: ProductionServiceModule) {
	return new Elysia({ prefix: '/production' }).use(initWorkOrderRoute(s.workOrder))
}

// Feature exports
export * from './work-order/work-order.dto'
export * from './work-order/work-order.repo'
export * from './work-order/work-order.service'
export * from './work-order/work-order.route'

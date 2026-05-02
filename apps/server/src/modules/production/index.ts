import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import type { InventoryServiceModule } from '@/modules/inventory'
import type { RecipeService } from '@/modules/recipe'

interface ProductionServiceModuleDeps {
	recipe: RecipeService
	inventory: InventoryServiceModule
}

import { WorkOrderRepo } from './work-order/work-order.repo'
import { initWorkOrderRoute } from './work-order/work-order.route'
import { WorkOrderService } from './work-order/work-order.service'

export class ProductionServiceModule {
	public readonly workOrder: WorkOrderService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
		private readonly deps: ProductionServiceModuleDeps,
	) {
		const workOrderRepo = new WorkOrderRepo(this.db, this.cacheClient)
		this.workOrder = new WorkOrderService(
			workOrderRepo,
			this.db,
			this.deps.recipe,
			this.deps.inventory,
		)
	}
}

export function initProductionRouteModule(s: ProductionServiceModule) {
	return new Elysia({ prefix: '/production' }).use(initWorkOrderRoute(s.workOrder))
}

export * from './work-order/work-order.dto'
export type { WorkOrderService } from './work-order/work-order.service'

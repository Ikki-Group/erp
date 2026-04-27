import { Elysia } from 'elysia'

import type { InventoryServiceModule } from '@/modules/inventory'
import type { RecipeService } from '@/modules/recipe'

import { initWorkOrderRoute } from './work-order/work-order.route'
import { WorkOrderService } from './work-order/work-order.service'

export class ProductionServiceModule {
	public readonly workOrder: WorkOrderService

	constructor(recipeSvc: RecipeService, inventorySvc: InventoryServiceModule) {
		this.workOrder = new WorkOrderService(recipeSvc, inventorySvc)
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

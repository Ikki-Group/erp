import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'

import type { DbClient } from '@/infra/database'

import type { StockTransactionService } from '@/modules/inventory'
import type { RecipeService } from '@/modules/recipe'

interface ProductionServiceModuleDeps {
	recipe: RecipeService
	stockTransaction: StockTransactionService
}

import { WorkOrderRepo } from './work-order.repo'
import { initWorkOrderRoute } from './work-order.route'
import { WorkOrderService } from './work-order.service'

export class ProductionServiceModule {
	public readonly workOrder: WorkOrderService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
		private readonly deps: ProductionServiceModuleDeps,
	) {
		const workOrderRepo = new WorkOrderRepo(this.db)
		this.workOrder = new WorkOrderService(
			workOrderRepo,
			this.db,
			this.deps.recipe,
			this.deps.stockTransaction,
			this.cacheClient,
		)
	}
}

export function initProductionRouteModule(s: ProductionServiceModule) {
	return new Elysia({ prefix: '/production' }).use(initWorkOrderRoute(s.workOrder))
}

export {
	WorkOrderSchema,
	WorkOrderCreateSchema,
	WorkOrderUpdateSchema,
	WorkOrderFilterSchema,
	WorkOrderCompleteSchema,
	WorkOrderStatusEnum,
	type WorkOrderStatus,
} from './work-order.schema'
export type { WorkOrderService } from './work-order.service'

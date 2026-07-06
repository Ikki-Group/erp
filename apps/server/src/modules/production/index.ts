import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import type { StockTransactionService } from '@/modules/inventory'
import type { RecipeService } from '@/modules/recipe'

import { createWorkOrderModule } from './work-order.module'
import { createWorkOrderRoute } from './work-order.route'

interface ProductionServiceModuleDeps {
	recipe: RecipeService
	stockTransaction: StockTransactionService
}

export interface ProductionServiceModule {
	workOrder: ReturnType<typeof createWorkOrderModule>
}

export function createProductionServiceModule(
	db: DbClient,
	cacheClient: CacheClient,
	deps: ProductionServiceModuleDeps,
): ProductionServiceModule {
	const workOrder = createWorkOrderModule(db, cacheClient, {
		recipe: deps.recipe,
		stockTransaction: deps.stockTransaction,
	})

	return { workOrder }
}

export function initProductionRouteModule(s: ProductionServiceModule) {
	return new Elysia({ prefix: '/production' }).use(createWorkOrderRoute(s.workOrder))
}

export {
	WorkOrderDto,
	WorkOrderCreateDto,
	WorkOrderUpdateDto,
	WorkOrderFilterDto,
	WorkOrderCompleteDto,
	WorkOrderStatusEnum,
	type WorkOrderStatus,
} from './work-order.contract'

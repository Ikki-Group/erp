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

export class ProductionServiceModule {
	public readonly workOrder: ReturnType<typeof createWorkOrderModule>

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
		private readonly deps: ProductionServiceModuleDeps,
	) {
		this.workOrder = createWorkOrderModule(this.db, this.cacheClient, {
			recipe: this.deps.recipe,
			stockTransaction: this.deps.stockTransaction,
		})
	}
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

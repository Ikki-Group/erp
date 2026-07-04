import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import type { StockTransactionService } from '@/modules/inventory'
import type { RecipeService } from '@/modules/recipe'
import { WorkOrderRepo } from './work-order.repo'
import { type RecipeReadPort, type StockTransactionPort, WorkOrderService } from './work-order.service'

export type { WorkOrderService, RecipeReadPort, StockTransactionPort }

export type WorkOrderModule = WorkOrderService

interface WorkOrderModuleDeps {
	recipe: RecipeService
	stockTransaction: StockTransactionService
}

export function createWorkOrderModule(
	db: DbContext,
	cacheClient: CacheClient,
	deps: WorkOrderModuleDeps,
): WorkOrderModule {
	const repo = new WorkOrderRepo(db)

	const recipePort: RecipeReadPort = {
		getById: async (id) => {
			const r = await deps.recipe.getById(id)
			if (!r) return undefined
			return {
				id: r.id,
				materialId: r.materialId,
				targetQty: r.targetQty,
				items: r.items?.map((i) => ({
					materialId: i.materialId,
					qty: i.qty,
					scrapPercentage: i.scrapPercentage,
				})),
			}
		},
		handleCalculateCost: (id) => deps.recipe.handleCalculateCost(id),
	}

	const stockPort: StockTransactionPort = {
		productionIn: (data, actorId, tx) => deps.stockTransaction.productionIn(data, actorId, tx),
		productionOut: (data, actorId, tx) => deps.stockTransaction.productionOut(data, actorId, tx),
	}

	return new WorkOrderService({ recipe: recipePort, stockTransaction: stockPort }, repo, cacheClient)
}

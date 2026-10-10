import type { Infra } from '@/shared/module.ts'

import type { StockService } from '@/modules/inventory/index.ts'
import type { MaterialService } from '@/modules/material/index.ts'
import type { ItemService } from '@/modules/menu/index.ts'
import type { UomService } from '@/modules/uom/index.ts'

import { RecipeRepo } from './recipe.repo.ts'
import { createRecipeRoute } from './recipe.route.ts'
import { RecipeService } from './recipe.service.ts'

export function createRecipeModule(
	infra: Infra,
	deps: {
		menu: Pick<ItemService, 'handleGetById'>
		material: Pick<MaterialService, 'getById' | 'getByIds'>
		uom: Pick<UomService, 'getById' | 'handleGetById' | 'getAllConversions'>
		stock: Pick<StockService, 'getBalances'>
	},
) {
	const recipeService = new RecipeService({ ...infra, ...deps, repo: new RecipeRepo(infra.db) })
	return { route: createRecipeRoute(recipeService), recipeService }
}

export type { RecipeService }
export { recipeUsage } from './recipe.calculator.ts'

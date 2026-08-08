import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import type { MaterialService } from '@/modules/material/material.service.ts'
import type { ItemService } from '@/modules/menu/item/item.service.ts'
import type { UomService } from '@/modules/uom/uom.service.ts'

import { RecipeRepo } from './recipe.repo.ts'
import { createRecipeRoute } from './recipe.route.ts'
import { RecipeService } from './recipe.service.ts'

// ─── Dependencies ───

export interface RecipeModuleDeps {
	materialService: MaterialService
	uomService: UomService
	itemService: ItemService
}

// ─── Module Factory ───

export function createRecipeModule(
	db: DbContext,
	cacheClient: CacheClient,
	deps: RecipeModuleDeps,
) {
	const repo = new RecipeRepo(db)
	const service = new RecipeService(
		repo,
		cacheClient,
		deps.materialService,
		deps.uomService,
		deps.itemService,
	)
	const route = createRecipeRoute(service)

	return { route, service }
}

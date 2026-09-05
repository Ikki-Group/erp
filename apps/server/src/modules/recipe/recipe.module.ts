import { cache } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { ModuleDescriptor } from '@/shared/module/registry.ts'

import type { MaterialApi } from '@/modules/material/index.ts'
import type { MenuApi } from '@/modules/menu/index.ts'
import type { UomApi } from '@/modules/uom/index.ts'

import { RecipeRepo } from './recipe.repo.ts'
import { createRecipeRoute } from './recipe.route.ts'
import { RecipeService } from './recipe.service.ts'

function createRecipeModule(
	db: DbContext,
	deps: {
		materialService: MaterialApi['service']
		uomService: UomApi['service']
		itemService: MenuApi['itemService']
	},
) {
	const service = new RecipeService(
		new RecipeRepo(db),
		cache,
		deps.materialService,
		deps.uomService,
		deps.itemService,
	)
	return { route: createRecipeRoute(service), service }
}

export interface RecipeApi extends Record<string, unknown> {
	service: RecipeService
	activeByMenuItem: RecipeService['getActiveByMenuItemId']
	linesByRecipe: RecipeService['getLinesByRecipeId']
}

function isMaterialApi(api: Record<string, unknown> | undefined): api is MaterialApi {
	return Boolean(api?.service && typeof api.service === 'object')
}
function isMenuApi(api: Record<string, unknown> | undefined): api is MenuApi {
	return Boolean(api?.itemService && api.composedService)
}
function isUomApi(api: Record<string, unknown> | undefined): api is UomApi {
	return Boolean(api?.service && typeof api.service === 'object')
}

export const recipeModule: ModuleDescriptor = {
	name: 'recipe',
	layer: 1,
	dependsOn: ['material', 'uom', 'menu'],
	create(ctx, deps) {
		if (
			!isMaterialApi(deps.material?.api) ||
			!isUomApi(deps.uom?.api) ||
			!isMenuApi(deps.menu?.api)
		)
			throw new Error('Recipe dependencies are missing')
		const built = createRecipeModule(ctx.db, {
			materialService: deps.material.api.service,
			uomService: deps.uom.api.service,
			itemService: deps.menu.api.itemService,
		})
		return {
			route: built.route,
			api: {
				service: built.service,
				activeByMenuItem: built.service.getActiveByMenuItemId.bind(built.service),
				linesByRecipe: built.service.getLinesByRecipeId.bind(built.service),
			},
		}
	},
}

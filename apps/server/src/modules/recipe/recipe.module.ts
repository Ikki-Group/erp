import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { ModuleDescriptor } from '@/shared/module/registry.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

import type { MaterialApi } from '@/modules/material/index.ts'
import type { MenuApi } from '@/modules/menu/index.ts'
import type { UomApi } from '@/modules/uom/index.ts'

import { RecipeRepo } from './recipe.repo.ts'
import { createRecipeRoute } from './recipe.route.ts'
import { RecipeService } from './recipe.service.ts'

function createRecipeModule(
	db: DbContext,
	cacheClient: CacheClient,
	deps: {
		materialService: MaterialApi['service']
		uomService: UomApi['service']
		itemGetById: MenuApi['itemGetById']
		uow: UnitOfWork
		audit: AuditPort
	},
) {
	const service = new RecipeService(
		new RecipeRepo(db),
		cacheClient,
		deps.materialService,
		deps.uomService,
		deps.itemGetById,
		deps.uow,
		deps.audit,
	)
	return { route: createRecipeRoute(service), service }
}

export interface RecipeApi extends Record<string, unknown> {
	service: RecipeService
	activeByMenuItem: RecipeService['getActiveByMenuItemId']
	linesByRecipe: RecipeService['getLinesByRecipeId']
}

function isMaterialApi(api: Record<string, unknown> | undefined): api is MaterialApi {
	const service = api?.service
	if (!api || typeof service !== 'object' || service === null) return false
	return (
		'getById' in service &&
		typeof service.getById === 'function' &&
		'handleGetById' in service &&
		typeof service.handleGetById === 'function'
	)
}

function isUomApi(api: Record<string, unknown> | undefined): api is UomApi {
	const service = api?.service
	if (!api || typeof service !== 'object' || service === null) return false
	return 'getAllConversions' in service && typeof service.getAllConversions === 'function'
}

function isMenuApi(api: Record<string, unknown> | undefined): api is MenuApi {
	return typeof api?.itemGetById === 'function'
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
		const built = createRecipeModule(ctx.db, ctx.cacheClient, {
			materialService: deps.material.api.service,
			uomService: deps.uom.api.service,
			itemGetById: deps.menu.api.itemGetById,
			uow: ctx.uow,
			audit: ctx.auditPort,
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

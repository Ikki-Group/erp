import { Elysia } from 'elysia'

import type { DbClient } from '@/core/database'

import type { CacheClient } from '@/lib/cache'

import { RecipeRepo } from './recipe.repo'
import { initRecipeRoute } from './recipe.route'
import { RecipeService } from './recipe.service'

export class RecipeServiceModule {
	public readonly recipe: RecipeService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {
		const recipeRepo = new RecipeRepo(this.db)
		this.recipe = new RecipeService(recipeRepo, this.cacheClient)
	}
}

export function initRecipeRouteModule(s: RecipeServiceModule) {
	return new Elysia({ prefix: '/recipe' }).use(initRecipeRoute(s.recipe))
}

export * from './recipe.dto'
export type { RecipeService } from './recipe.service'

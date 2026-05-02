import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { RecipeRepo } from './core/recipe.repo'
import { initRecipeRoute } from './core/recipe.route'
import { RecipeService } from './core/recipe.service'

export class RecipeServiceModule {
	public readonly recipe: RecipeService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {
		const recipeRepo = new RecipeRepo(this.db, this.cacheClient)
		this.recipe = new RecipeService(recipeRepo)
	}
}

export function initRecipeRouteModule(s: RecipeServiceModule) {
	return new Elysia({ prefix: '/recipe' }).use(initRecipeRoute(s.recipe))
}

export * from './core/recipe.dto'
export type { RecipeService } from './core/recipe.service'

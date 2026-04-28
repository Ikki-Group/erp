import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { RecipeRepo } from './recipe/recipe.repo'
import { initRecipeRoute } from './recipe/recipe.route'
import { RecipeService } from './recipe/recipe.service'

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

// Feature exports
export * from './recipe/recipe.dto'
export * from './recipe/recipe.repo'
export * from './recipe/recipe.service'
export * from './recipe/recipe.route'

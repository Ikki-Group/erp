import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { RecipeRepo } from './recipe.repo'
import { initRecipeRoute } from './recipe.route'
import type {
	RecipeSchema,
	RecipeSelectSchema,
	RecipeFilterSchema,
	RecipeCreateSchema,
	RecipeUpdateSchema,
	RecipeItemSchema,
	RecipeCostSchema,
} from './recipe.schema'
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

export type {
	RecipeSchema,
	RecipeSelectSchema,
	RecipeFilterSchema,
	RecipeCreateSchema,
	RecipeUpdateSchema,
	RecipeItemSchema,
	RecipeCostSchema,
}
export type { RecipeService } from './recipe.service'

import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import type {
	RecipeDto,
	RecipeSelectDto,
	RecipeFilterDto,
	RecipeCreateDto,
	RecipeUpdateDto,
	RecipeItemDto,
	RecipeCostDto,
} from './recipe.contract'
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

export type {
	RecipeDto,
	RecipeSelectDto,
	RecipeFilterDto,
	RecipeCreateDto,
	RecipeUpdateDto,
	RecipeItemDto,
	RecipeCostDto,
}
export type { RecipeService } from './recipe.service'

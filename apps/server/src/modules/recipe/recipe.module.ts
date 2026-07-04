import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { RecipeRepo } from './recipe.repo'
import { RecipeService } from './recipe.service'

export type RecipeModule = RecipeService

export function createRecipeModule(db: DbContext, cacheClient: CacheClient): RecipeModule {
	const repo = new RecipeRepo(db)
	const recipe = new RecipeService(repo, cacheClient)
	return recipe
}

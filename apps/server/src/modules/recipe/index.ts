import { Elysia } from 'elysia'

import { initRecipeRoute } from './recipe/recipe.route'
import { RecipeService } from './recipe/recipe.service'

export class RecipeServiceModule {
	public readonly recipe: RecipeService

	constructor() {
		this.recipe = new RecipeService()
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

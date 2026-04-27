import Elysia from 'elysia'

import type { RecipeServiceModule } from '../service'
import { initRecipeRoute } from './recipe.route'

export function initRecipeRouteModule(service: RecipeServiceModule) {
	const recipeRouter = initRecipeRoute(service)

	return new Elysia({ prefix: '/recipe' }).use(recipeRouter)
}

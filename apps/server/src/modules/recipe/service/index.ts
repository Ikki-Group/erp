import { RecipeService } from './recipe.service'

export class RecipeServiceModule {
	public readonly recipe: RecipeService

	constructor() {
		this.recipe = new RecipeService()
	}
}

export * from './recipe.service'

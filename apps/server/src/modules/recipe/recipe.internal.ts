import { NotFoundError, InternalServerError } from '@/shared/errors/http-error'

export const RecipeError = {
	notFound: (id: number) =>
		new NotFoundError('Recipe not found', { code: 'RECIPE_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Recipe creation failed', { code: 'RECIPE_CREATE_FAILED' }),
}

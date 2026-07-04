import { ConflictError, NotFoundError, InternalServerError } from '@/shared/errors/http-error'

export const RecipeError = {
	notFound: (id: number) =>
		new NotFoundError('Recipe not found', { code: 'RECIPE_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Recipe creation failed', { code: 'RECIPE_CREATE_FAILED' }),
	targetMissing: () =>
		new ConflictError('Recipe must have exactly one target', { code: 'RECIPE_MISSING_TARGET' }),
	targetExists: () =>
		new ConflictError('A recipe already exists for this target', {
			code: 'RECIPE_TARGET_ALREADY_EXISTS',
		}),
}

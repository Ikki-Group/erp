import { ConflictError, NotFoundError } from '@/shared/errors/http-error'

export const RecipeError = {
	notFound: (id: number) =>
		new NotFoundError(`Recipe with ID ${id} not found`, { code: 'RECIPE_NOT_FOUND' }),
	targetMissing: () =>
		new ConflictError('Recipe must have exactly one target', { code: 'RECIPE_MISSING_TARGET' }),
	targetExists: () =>
		new ConflictError('A recipe already exists for this target', {
			code: 'RECIPE_TARGET_ALREADY_EXISTS',
		}),
}

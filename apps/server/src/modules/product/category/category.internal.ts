import { ConflictError, InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const CategoryError = {
	notFound: (id: number) =>
		new NotFoundError('Product category not found', {
			code: 'PRODUCT_CATEGORY_NOT_FOUND',
			context: { id },
		}),
	createFailed: () =>
		new InternalServerError('Product category creation failed', {
			code: 'PRODUCT_CATEGORY_CREATE_FAILED',
		}),
	nameConflict: (locationId: number) =>
		new ConflictError('Product category name already exists in this location', {
			code: 'PRODUCT_CATEGORY_NAME_ALREADY_EXISTS',
			context: { locationId },
		}),
}

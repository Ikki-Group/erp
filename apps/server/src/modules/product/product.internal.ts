import { ConflictError, InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const ProductError = {
	notFound: (id: number) =>
		new NotFoundError('Product not found', { code: 'PRODUCT_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Product creation failed', { code: 'PRODUCT_CREATE_FAILED' }),
	updateFailed: (id: number) =>
		new InternalServerError('Product update failed', { code: 'PRODUCT_UPDATE_FAILED', context: { id } }),
	skuConflict: () =>
		new ConflictError('Product SKU already exists in this location', { code: 'PRODUCT_SKU_ALREADY_EXISTS' }),
	nameConflict: () =>
		new ConflictError('Product name already exists in this location', { code: 'PRODUCT_NAME_ALREADY_EXISTS' }),
	multipleDefaultVariants: () =>
		new ConflictError('Only one variant can be set as default', { code: 'MULTIPLE_DEFAULT_VARIANTS' }),
}

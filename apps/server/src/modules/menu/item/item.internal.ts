import {
	BadRequestError,
	ConflictError,
	InternalServerError,
	NotFoundError,
} from '@/shared/errors/http-error.ts'

// ─── Error Factories ───

export const ItemError = {
	notFound: (id: number) =>
		new NotFoundError('Menu item not found', {
			code: 'MENU_ITEM_NOT_FOUND',
			context: { id },
		}),
	createFailed: () =>
		new InternalServerError('Menu item creation failed', {
			code: 'MENU_ITEM_CREATE_FAILED',
		}),
	updateFailed: (id: number) =>
		new InternalServerError('Menu item update failed', {
			code: 'MENU_ITEM_UPDATE_FAILED',
			context: { id },
		}),
	deleteFailed: (id: number) =>
		new InternalServerError('Menu item deletion failed', {
			code: 'MENU_ITEM_DELETE_FAILED',
			context: { id },
		}),
	skuExists: (sku: string) =>
		new ConflictError('SKU already exists at this location', {
			code: 'MENU_ITEM_SKU_EXISTS',
			context: { sku },
		}),
	invalidCategory: () =>
		new BadRequestError('Category must belong to the same location', {
			code: 'MENU_ITEM_INVALID_CATEGORY',
		}),
}

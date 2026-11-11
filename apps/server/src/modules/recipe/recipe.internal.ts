import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

// ─── Error Factories ───

export const RecipeError = {
	notFound: (id: number) =>
		new NotFoundError('Recipe not found', { code: 'RECIPE_NOT_FOUND', context: { id } }),
	activeNotFound: (menuItemId: number) =>
		new NotFoundError('No active recipe for this menu item', {
			code: 'RECIPE_ACTIVE_NOT_FOUND',
			context: { menuItemId },
		}),
	createFailed: () =>
		new InternalServerError('Recipe creation failed', { code: 'RECIPE_CREATE_FAILED' }),
	updateFailed: (id: number) =>
		new InternalServerError('Recipe update failed', {
			code: 'RECIPE_UPDATE_FAILED',
			context: { id },
		}),
	deleteFailed: (id: number) =>
		new InternalServerError('Recipe deletion failed', {
			code: 'RECIPE_DELETE_FAILED',
			context: { id },
		}),
	deactivateFailed: (menuItemId: number) =>
		new InternalServerError('Recipe deactivation failed', {
			code: 'RECIPE_DEACTIVATE_FAILED',
			context: { menuItemId },
		}),
	menuItemNotFound: (menuItemId: number) =>
		new NotFoundError('Menu item not found', {
			code: 'MENU_ITEM_NOT_FOUND',
			context: { menuItemId },
		}),
	materialNotFound: (materialId: number) =>
		new NotFoundError('Material not found', {
			code: 'MATERIAL_NOT_FOUND',
			context: { materialId },
		}),
	uomNotConvertible: (uomId: number, baseUomId: number) =>
		new BadRequestError('Recipe line UoM is not convertible to material base UoM', {
			code: 'UOM_NOT_CONVERTIBLE',
			context: { uomId, baseUomId },
		}),
}

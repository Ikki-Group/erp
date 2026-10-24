import { defineEntityErrors } from '@/shared/errors/entity-errors.ts'
import { BadRequestError, ConflictError } from '@/shared/errors/http-error.ts'

// ─── Error Factories ───

export const ItemError = {
	...defineEntityErrors('Menu item', 'MENU_ITEM'),
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

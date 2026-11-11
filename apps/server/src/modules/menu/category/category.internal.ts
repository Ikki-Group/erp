import { menuCategories } from '@/db/schema/menu.ts'

import { defineConflictFields } from '@/infra/database/index.ts'
import { defineEntityErrors } from '@/shared/errors/entity-errors.ts'
import { BadRequestError } from '@/shared/errors/http-error.ts'

import type { MenuCategoryCreateDto } from './category.contract.ts'

// ─── Error Factories ───

export const CategoryError = {
	...defineEntityErrors('Menu category', 'MENU_CATEGORY'),
	invalidParent: () =>
		new BadRequestError('Parent category must belong to the same location', {
			code: 'MENU_CATEGORY_INVALID_PARENT',
		}),
}

// ─── Unique Constraint Fields ───

export const uniqueFields = defineConflictFields<MenuCategoryCreateDto>()([
	{
		field: 'name',
		column: menuCategories.name,
		message: 'Menu category name already exists at this location',
		code: 'MENU_CATEGORY_NAME_EXISTS',
	},
])

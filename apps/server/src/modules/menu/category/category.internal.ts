import { menuCategories } from '@/db/schema/menu.ts'

import { defineConflictFields } from '@/infra/database/index.ts'
import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

import type { MenuCategoryCreateDto } from './category.contract.ts'

// ─── Error Factories ───

export const CategoryError = {
	notFound: (id: number) =>
		new NotFoundError('Menu category not found', {
			code: 'MENU_CATEGORY_NOT_FOUND',
			context: { id },
		}),
	createFailed: () =>
		new InternalServerError('Menu category creation failed', {
			code: 'MENU_CATEGORY_CREATE_FAILED',
		}),
	updateFailed: (id: number) =>
		new InternalServerError('Menu category update failed', {
			code: 'MENU_CATEGORY_UPDATE_FAILED',
			context: { id },
		}),
	deleteFailed: (id: number) =>
		new InternalServerError('Menu category deletion failed', {
			code: 'MENU_CATEGORY_DELETE_FAILED',
			context: { id },
		}),
	invalidParent: () =>
		new BadRequestError('Parent category must belong to the same location', {
			code: 'MENU_CATEGORY_INVALID_PARENT',
		}),
}

// ─── Unique Constraint Fields ───

// ponytail: checked globally, not per location (checkConflict has no scope column).
export const categoryUniqueFields = defineConflictFields<MenuCategoryCreateDto>()([
	{
		field: 'name',
		column: menuCategories.name,
		message: 'Menu category name already exists at this location',
		code: 'MENU_CATEGORY_NAME_EXISTS',
	},
])

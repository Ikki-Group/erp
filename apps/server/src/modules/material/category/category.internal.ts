import { materialCategories } from '@/db/schema/material.ts'

import { defineConflictFields } from '@/infra/database/index.ts'
import { defineEntityErrors } from '@/shared/errors/entity-errors.ts'

import type { MaterialCategoryCreateDto } from './category.contract.ts'

// ─── Error Factories ───

export const CategoryError = defineEntityErrors('Material category', 'MATERIAL_CATEGORY')

// ─── Unique Constraint Fields ───

export const uniqueFields = defineConflictFields<MaterialCategoryCreateDto>()([
	{
		field: 'name',
		column: materialCategories.name,
		message: 'Material category name already exists',
		code: 'MATERIAL_CATEGORY_NAME_EXISTS',
	},
])

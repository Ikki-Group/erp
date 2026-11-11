import { materials } from '@/db/schema/material.ts'

import { defineConflictFields } from '@/infra/database/index.ts'
import { defineEntityErrors } from '@/shared/errors/entity-errors.ts'
import { BadRequestError } from '@/shared/errors/http-error.ts'

import type { MaterialCreateDto } from './material.contract.ts'

// ─── Error Factories ───

export const MaterialError = {
	...defineEntityErrors('Material', 'MATERIAL'),
	uomNotConvertible: (fromUomId: number, toUomId: number) =>
		new BadRequestError('Default UoM is not convertible to base UoM', {
			code: 'MATERIAL_UOM_NOT_CONVERTIBLE',
			context: { fromUomId, toUomId },
		}),
}

// ─── Unique Constraint Fields ───

export const uniqueFields = defineConflictFields<MaterialCreateDto>()([
	{
		field: 'code',
		column: materials.code,
		message: 'Material code already exists',
		code: 'MATERIAL_CODE_EXISTS',
	},
])

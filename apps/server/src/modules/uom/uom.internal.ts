import { uoms } from '@/db/schema/uom.ts'

import { defineConflictFields } from '@/infra/database/index.ts'
import { defineEntityErrors } from '@/shared/errors/entity-errors.ts'
import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

import type { UomCreateDto } from './uom.contract.ts'

// ─── Constants ───

export const SYSTEM_UOM_CODES = ['kg', 'g', 'l', 'ml', 'pcs'] as const

export const MAX_CONVERSION_HOPS = 5

// ─── Error Factories ───

export const UomError = {
	...defineEntityErrors('UoM', 'UOM'),
	systemUomImmutable: (id: number) =>
		new BadRequestError('System UoM cannot be modified or deleted', {
			code: 'UOM_SYSTEM_IMMUTABLE',
			context: { id },
		}),
	conversionNotFound: (id: number) =>
		new NotFoundError('UoM conversion not found', {
			code: 'UOM_CONVERSION_NOT_FOUND',
			context: { id },
		}),
	conversionCategoryMismatch: (fromId: number, toId: number) =>
		new BadRequestError('Conversions are only allowed within the same category', {
			code: 'UOM_CONVERSION_CATEGORY_MISMATCH',
			context: { fromId, toId },
		}),
	noConversionPath: (fromId: number, toId: number) =>
		new BadRequestError('No conversion path exists between the given UoMs', {
			code: 'UOM_NO_CONVERSION_PATH',
			context: { fromId, toId },
		}),
	conversionCreateFailed: () =>
		new InternalServerError('UoM conversion creation failed', {
			code: 'UOM_CONVERSION_CREATE_FAILED',
		}),
}

// ─── Unique Constraint Fields ───

export const uniqueFields = defineConflictFields<UomCreateDto>()([
	{
		field: 'code',
		column: uoms.code,
		message: 'UoM code already exists',
		code: 'UOM_CODE_EXISTS',
	},
])

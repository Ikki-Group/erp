import { materials } from '@/db/schema/material.ts'
import { defineConflictFields } from '@/infra/database/index.ts'
import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

import type { MaterialCreateDto } from './material.contract.ts'

// ─── Error Factories ───

export const MaterialError = {
	notFound: (id: number) =>
		new NotFoundError('Material not found', { code: 'MATERIAL_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Material creation failed', { code: 'MATERIAL_CREATE_FAILED' }),
	updateFailed: (id: number) =>
		new InternalServerError('Material update failed', { code: 'MATERIAL_UPDATE_FAILED', context: { id } }),
	deleteFailed: (id: number) =>
		new InternalServerError('Material deletion failed', { code: 'MATERIAL_DELETE_FAILED', context: { id } }),
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

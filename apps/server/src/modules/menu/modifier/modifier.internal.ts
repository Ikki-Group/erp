import { modifierGroups } from '@/db/schema/menu.ts'

import { defineConflictFields } from '@/infra/database/index.ts'
import { InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

import type { ModifierGroupCreateDto } from './modifier.contract.ts'

// ─── Error Factories ───

export const ModifierError = {
	notFound: (id: number) =>
		new NotFoundError('Modifier group not found', {
			code: 'MODIFIER_GROUP_NOT_FOUND',
			context: { id },
		}),
	createFailed: () =>
		new InternalServerError('Modifier group creation failed', {
			code: 'MODIFIER_GROUP_CREATE_FAILED',
		}),
	updateFailed: (id: number) =>
		new InternalServerError('Modifier group update failed', {
			code: 'MODIFIER_GROUP_UPDATE_FAILED',
			context: { id },
		}),
	deleteFailed: (id: number) =>
		new InternalServerError('Modifier group deletion failed', {
			code: 'MODIFIER_GROUP_DELETE_FAILED',
			context: { id },
		}),
}

// ─── Unique Constraint Fields ───

// ponytail: checked globally, not per location (checkConflict has no scope column).
export const modifierUniqueFields = defineConflictFields<ModifierGroupCreateDto>()([
	{
		field: 'name',
		column: modifierGroups.name,
		message: 'Modifier group name already exists at this location',
		code: 'MODIFIER_GROUP_NAME_EXISTS',
	},
])

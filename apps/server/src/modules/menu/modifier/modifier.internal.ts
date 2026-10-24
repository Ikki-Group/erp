import { modifierGroups } from '@/db/schema/menu.ts'

import { defineConflictFields } from '@/infra/database/index.ts'
import { defineEntityErrors } from '@/shared/errors/entity-errors.ts'

import type { ModifierGroupCreateDto } from './modifier.contract.ts'

// ─── Error Factories ───

export const ModifierError = defineEntityErrors('Modifier group', 'MODIFIER_GROUP')

// ─── Unique Constraint Fields ───

export const uniqueFields = defineConflictFields<ModifierGroupCreateDto>()([
	{
		field: 'name',
		column: modifierGroups.name,
		message: 'Modifier group name already exists at this location',
		code: 'MODIFIER_GROUP_NAME_EXISTS',
	},
])

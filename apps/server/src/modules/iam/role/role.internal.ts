import { roles } from '@/db/schema/iam.ts'

import { defineConflictFields } from '@/infra/database/index.ts'
import { defineEntityErrors } from '@/shared/errors/entity-errors.ts'
import { ConflictError, ForbiddenError } from '@/shared/errors/http-error.ts'

import type { RoleCreateDto } from './role.contract.ts'

// ─── Error Factories ───

export const RoleError = {
	...defineEntityErrors('Role', 'ROLE'),
	systemRoleImmutable: () =>
		new ForbiddenError('System role cannot be modified', { code: 'SYSTEM_ROLE_IMMUTABLE' }),
	assignedRole: (id: number) =>
		new ConflictError('Role is assigned to one or more users', {
			code: 'ROLE_ASSIGNED',
			context: { id },
		}),
}

// ─── Unique Constraint Fields ───

export const uniqueFields = defineConflictFields<RoleCreateDto>()([
	{
		field: 'code',
		column: roles.code,
		message: 'Role code already exists',
		code: 'ROLE_CODE_EXISTS',
	},
])

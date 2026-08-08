import { roles } from '@/db/schema/iam.ts'

import { defineConflictFields } from '@/infra/database/index.ts'
import { ForbiddenError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

import type { RoleCreateDto } from './role.contract.ts'

// ─── Error Factories ───

export const RoleError = {
	notFound: (id: number) =>
		new NotFoundError('Role not found', { code: 'ROLE_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Role creation failed', { code: 'ROLE_CREATE_FAILED' }),
	updateFailed: (id: number) =>
		new InternalServerError('Role update failed', { code: 'ROLE_UPDATE_FAILED', context: { id } }),
	systemRoleImmutable: () =>
		new ForbiddenError('System role cannot be modified', { code: 'SYSTEM_ROLE_IMMUTABLE' }),
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

import { users } from '@/db/schema/iam.ts'

import { defineConflictFields } from '@/infra/database/index.ts'
import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

import type { UserCreateDto } from './user.contract.ts'

// ─── Error Factories ───

export const UserError = {
	notFound: (id: number) =>
		new NotFoundError('User not found', { code: 'USER_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('User creation failed', { code: 'USER_CREATE_FAILED' }),
	updateFailed: (id: number) =>
		new InternalServerError('User update failed', { code: 'USER_UPDATE_FAILED', context: { id } }),
	deactivateFailed: (id: number) =>
		new InternalServerError('User deactivation failed', {
			code: 'USER_DEACTIVATE_FAILED',
			context: { id },
		}),
	resetPasswordFailed: (id: number) =>
		new InternalServerError('User password reset failed', {
			code: 'USER_RESET_PASSWORD_FAILED',
			context: { id },
		}),
	// 400, not 401: the web client treats 401 as an expired session and logs out.
	invalidCurrentPassword: () =>
		new BadRequestError('Current password is incorrect', { code: 'INVALID_CURRENT_PASSWORD' }),
	passwordUnchanged: () =>
		new BadRequestError('New password must differ from the current password', {
			code: 'PASSWORD_UNCHANGED',
		}),
}

// ─── Unique Constraint Fields ───

export const uniqueFields = defineConflictFields<UserCreateDto>()([
	{
		field: 'username',
		column: users.username,
		message: 'Username already exists',
		code: 'USERNAME_EXISTS',
	},
	{
		field: 'email',
		column: users.email,
		message: 'Email already exists',
		code: 'EMAIL_EXISTS',
	},
])

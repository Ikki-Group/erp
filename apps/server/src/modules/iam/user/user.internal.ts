import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error'

/**
 * User Module Error Helpers
 *
 * Centralized error definitions for user management operations.
 */
export const UserError = {
	/**
	 * User not found by ID
	 * @param id - User ID that was not found
	 */
	notFound: (id: number) =>
		new NotFoundError('User not found', {
			code: 'USER_NOT_FOUND',
			context: { id },
		}),

	/**
	 * User not found by identifier (email or username)
	 * @param identifier - Email or username that was not found
	 */
	notFoundByIdentifier: (identifier: string) =>
		new NotFoundError('User not found', {
			code: 'USER_NOT_FOUND',
			context: { identifier },
		}),

	/**
	 * User creation failed (database or system error)
	 */
	createFailed: () =>
		new InternalServerError('User creation failed', {
			code: 'USER_CREATE_FAILED',
		}),

	/**
	 * Old password does not match during password change
	 */
	passwordMismatch: () =>
		new BadRequestError('Old password does not match', {
			code: 'USER_PASSWORD_MISMATCH',
		}),

	/**
	 * User is inactive and cannot perform action
	 * @param id - Inactive user ID
	 */
	userInactive: (id: number) =>
		new BadRequestError('User is inactive', {
			code: 'USER_INACTIVE',
			context: { id },
		}),
}

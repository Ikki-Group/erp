import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error'

/**
 * Role Module Error Helpers
 *
 * Centralized error definitions for role management operations.
 */
export const RoleError = {
	/**
	 * Role not found by ID
	 * @param id - Role ID that was not found
	 */
	notFound: (id: number) =>
		new NotFoundError('Role not found', {
			code: 'ROLE_NOT_FOUND',
			context: { id },
		}),

	/**
	 * Role creation failed (database or system error)
	 */
	createFailed: () =>
		new InternalServerError('Role creation failed', {
			code: 'ROLE_CREATE_FAILED',
		}),

	/**
	 * Cannot update system/built-in role
	 * System roles are protected from modification
	 */
	updateSystemRole: () =>
		new BadRequestError('Cannot update system role', {
			code: 'ROLE_UPDATE_SYSTEM_ROLE_FORBIDDEN',
		}),

	/**
	 * Cannot delete system/built-in role
	 * System roles are protected from deletion
	 */
	deleteSystemRole: () =>
		new BadRequestError('Cannot delete system role', {
			code: 'ROLE_DELETE_SYSTEM_ROLE_FORBIDDEN',
		}),
}

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
	 * Role not found by code
	 * @param code - Role code that was not found
	 */
	notFoundByCode: (code: string) =>
		new NotFoundError('Role not found', {
			code: 'ROLE_NOT_FOUND',
			context: { code },
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

	/**
	 * Role is in use and cannot be deleted
	 * @param id - Role ID that has active assignments
	 */
	roleInUse: (id: number) =>
		new BadRequestError('Role is currently assigned to users', {
			code: 'ROLE_IN_USE',
			context: { id },
		}),
}

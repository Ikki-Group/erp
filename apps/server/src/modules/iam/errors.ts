import {
	BadRequestError,
	InternalServerError,
	NotFoundError,
} from '@/core/http/errors'

/**
 * User errors - simple factory functions
 */
export const UserErrors = {
	notFound: (id: number) => new NotFoundError(`User with ID ${id} not found`, 'USER_NOT_FOUND'),
	createFailed: () => new InternalServerError('User creation failed', 'USER_CREATE_FAILED'),
	passwordMismatch: () =>
		new BadRequestError('Old password does not match', 'USER_PASSWORD_MISMATCH'),
}

/**
 * Role errors - simple factory functions
 */
export const RoleErrors = {
	notFound: (id: number) => new NotFoundError(`Role with ID ${id} not found`, 'ROLE_NOT_FOUND'),
	createFailed: () => new InternalServerError('Role creation failed', 'ROLE_CREATE_FAILED'),
	updateSystemRole: () =>
		new BadRequestError('Cannot update system role', 'ROLE_UPDATE_SYSTEM_ROLE_FORBIDDEN'),
	deleteSystemRole: () =>
		new BadRequestError('Cannot delete system role', 'ROLE_DELETE_SYSTEM_ROLE_FORBIDDEN'),
}

/**
 * Assignment errors - simple factory functions
 */
export const AssignmentErrors = {
	notFound: () => new NotFoundError('User assignment not found', 'ASSIGNMENT_NOT_FOUND'),
}

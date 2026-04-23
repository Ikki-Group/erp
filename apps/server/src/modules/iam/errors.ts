import {
	BadRequestError,
	ConflictError,
	InternalServerError,
	NotFoundError,
} from '@/core/http/errors'

/**
 * User domain errors
 */
export class UserNotFoundError extends NotFoundError {
	constructor(id: number) {
		super(`User with ID ${id} not found`, 'USER_NOT_FOUND')
	}
}

export class UserConflictError extends ConflictError {
	constructor(field: 'email' | 'username') {
		const messages = {
			email: 'Email already exists',
			username: 'Username already exists',
		}
		super(messages[field], `USER_${field.toUpperCase()}_EXISTS`)
	}
}

export class UserCreateFailedError extends InternalServerError {
	constructor() {
		super('User creation failed', 'USER_CREATE_FAILED')
	}
}

export class UserPasswordMismatchError extends BadRequestError {
	constructor() {
		super('Old password does not match', 'USER_PASSWORD_MISMATCH')
	}
}

/**
 * Role domain errors
 */
export class RoleNotFoundError extends NotFoundError {
	constructor(id: number) {
		super(`Role with ID ${id} not found`, 'ROLE_NOT_FOUND')
	}
}

export class RoleConflictError extends ConflictError {
	constructor(field: 'code' | 'name') {
		const messages = {
			code: 'Role code already exists',
			name: 'Role name already exists',
		}
		super(messages[field], `ROLE_${field.toUpperCase()}_EXISTS`)
	}
}

export class RoleCreateFailedError extends InternalServerError {
	constructor() {
		super('Role creation failed', 'ROLE_CREATE_FAILED')
	}
}

export class RoleSystemRoleError extends BadRequestError {
	constructor(operation: 'update' | 'delete') {
		const messages = {
			update: 'Cannot update system role',
			delete: 'Cannot delete system role',
		}
		super(messages[operation], `ROLE_SYSTEM_ROLE_${operation.toUpperCase()}_FORBIDDEN`)
	}
}

/**
 * Assignment domain errors
 */
export class AssignmentNotFoundError extends NotFoundError {
	constructor() {
		super('User assignment not found', 'ASSIGNMENT_NOT_FOUND')
	}
}

export class AssignmentConflictError extends ConflictError {
	constructor() {
		super(
			'User is already assigned to this location',
			'ASSIGNMENT_DUPLICATE_LOCATION',
		)
	}
}

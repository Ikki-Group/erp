/**
 * IAM Validators
 * Business logic validation separated from services
 * These handle domain-specific constraints and checks
 */

import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import { rolesTable, userAssignmentsTable, usersTable } from '@/db/schema'

import { UserConflictError, RoleConflictError } from './errors'
import type * as dto from './dto'

/**
 * User creation/update validation
 */
export const UserValidator = {
	/**
	 * Check for email uniqueness (excluding current record)
	 */
	async validateEmailUniqueness(
		email: string,
		excludeId?: number,
	): Promise<boolean> {
		const query = db.select({ id: usersTable.id }).from(usersTable).where(
			excludeId
				? and(eq(usersTable.email, email), eq(usersTable.id, excludeId))
				: eq(usersTable.email, email),
		)

		const existing = await query.limit(1)
		return existing.length === 0
	},

	/**
	 * Check for username uniqueness (excluding current record)
	 */
	async validateUsernameUniqueness(
		username: string,
		excludeId?: number,
	): Promise<boolean> {
		const query = db.select({ id: usersTable.id }).from(usersTable).where(
			excludeId
				? and(eq(usersTable.username, username), eq(usersTable.id, excludeId))
				: eq(usersTable.username, username),
		)

		const existing = await query.limit(1)
		return existing.length === 0
	},

	/**
	 * Check user conflicts for creation
	 */
	async checkCreateConflicts(data: dto.UserCreateDto): Promise<void> {
		const [emailExists, usernameExists] = await Promise.all([
			!this.validateEmailUniqueness(data.email),
			!this.validateUsernameUniqueness(data.username),
		])

		if (emailExists) throw new UserConflictError('email')
		if (usernameExists) throw new UserConflictError('username')
	},

	/**
	 * Check user conflicts for update
	 */
	async checkUpdateConflicts(
		id: number,
		data: Partial<Pick<dto.UserCreateDto, 'email' | 'username'>>,
	): Promise<void> {
		if (!data.email && !data.username) return

		const [emailExists, usernameExists] = await Promise.all([
			data.email ? !(await this.validateEmailUniqueness(data.email, id)) : false,
			data.username
				? !(await this.validateUsernameUniqueness(data.username, id))
				: false,
		])

		if (emailExists) throw new UserConflictError('email')
		if (usernameExists) throw new UserConflictError('username')
	},

	/**
	 * Validate user assignment (location + role are valid)
	 */
	async validateAssignment(
		_userId: number,
		_locationId: number,
		_roleId: number,
	): Promise<boolean> {
		// Check if location exists
		// Check if role exists
		// Check if assignment would create conflict
		// This is a placeholder - implement based on your business rules
		return true
	},
}

/**
 * Role creation/update validation
 */
export const RoleValidator = {
	/**
	 * Check for code uniqueness (excluding current record)
	 */
	async validateCodeUniqueness(code: string, excludeId?: number): Promise<boolean> {
		const query = db.select({ id: rolesTable.id }).from(rolesTable).where(
			excludeId
				? and(eq(rolesTable.code, code), eq(rolesTable.id, excludeId))
				: eq(rolesTable.code, code),
		)

		const existing = await query.limit(1)
		return existing.length === 0
	},

	/**
	 * Check for name uniqueness (excluding current record)
	 */
	async validateNameUniqueness(name: string, excludeId?: number): Promise<boolean> {
		const query = db.select({ id: rolesTable.id }).from(rolesTable).where(
			excludeId
				? and(eq(rolesTable.name, name), eq(rolesTable.id, excludeId))
				: eq(rolesTable.name, name),
		)

		const existing = await query.limit(1)
		return existing.length === 0
	},

	/**
	 * Check role conflicts for creation
	 */
	async checkCreateConflicts(data: dto.RoleCreateDto): Promise<void> {
		const [codeExists, nameExists] = await Promise.all([
			!(await this.validateCodeUniqueness(data.code)),
			!(await this.validateNameUniqueness(data.name)),
		])

		if (codeExists) throw new RoleConflictError('code')
		if (nameExists) throw new RoleConflictError('name')
	},

	/**
	 * Check role conflicts for update
	 */
	async checkUpdateConflicts(
		id: number,
		data: Partial<Pick<dto.RoleCreateDto, 'code' | 'name'>>,
	): Promise<void> {
		if (!data.code && !data.name) return

		const [codeExists, nameExists] = await Promise.all([
			data.code ? !(await this.validateCodeUniqueness(data.code, id)) : false,
			data.name ? !(await this.validateNameUniqueness(data.name, id)) : false,
		])

		if (codeExists) throw new RoleConflictError('code')
		if (nameExists) throw new RoleConflictError('name')
	},
}

/**
 * Assignment validation
 */
export const AssignmentValidator = {
	/**
	 * Check if user is already assigned to location
	 */
	async isUserAssignedToLocation(
		userId: number,
		locationId: number,
	): Promise<boolean> {
		const existing = await db
			.select({ id: userAssignmentsTable.id })
			.from(userAssignmentsTable)
			.where(
				and(
					eq(userAssignmentsTable.userId, userId),
					eq(userAssignmentsTable.locationId, locationId),
				),
			)
			.limit(1)

		return existing.length > 0
	},
}

import { z } from 'zod'

import { AssignmentCreateDto, UserCreateDto, UserUpdateDto } from './dto'
import type { UserDetailDto } from './dto'

export interface UserAssignmentFormValue {
	/** Created once with the row, never sent to the server. */
	clientKey: string
	roleId: number | null
	locationId: number | null
}

export type AssignmentMode = 'global' | 'per_location'

export interface UserFormValues {
	username: string
	email: string
	name: string
	password: string
	isActive: boolean
	assignmentMode: AssignmentMode
	assignments: UserAssignmentFormValue[]
}

const assignmentSchema = z.object({
	clientKey: z.string(),
	roleId: z
		.number()
		.int()
		.positive()
		.nullable()
		.refine((id) => id !== null, {
			message: 'Select a role for this assignment.',
		}),
	locationId: z.number().int().positive().nullable(),
})

const accessSchema = z
	.object({
		assignmentMode: z.enum(['global', 'per_location']),
		assignments: z.array(assignmentSchema),
	})
	.superRefine((values, context) => {
		const seenLocations = new Set<number>()
		const seenRoles = new Set<number>()

		values.assignments.forEach((assignment, index) => {
			if (values.assignmentMode === 'global' && assignment.locationId !== null) {
				context.addIssue({
					code: 'custom',
					path: ['assignments', index, 'locationId'],
					message: 'Global access cannot include a location.',
				})
			}
			if (values.assignmentMode === 'per_location' && assignment.locationId === null) {
				context.addIssue({
					code: 'custom',
					path: ['assignments', index, 'locationId'],
					message: 'Select a location for this assignment.',
				})
			}
			if (values.assignmentMode === 'global' && assignment.roleId !== null) {
				if (seenRoles.has(assignment.roleId)) {
					context.addIssue({
						code: 'custom',
						path: ['assignments', index, 'roleId'],
						message: 'This role is already assigned globally.',
					})
				}
				seenRoles.add(assignment.roleId)
			} else if (assignment.locationId !== null) {
				if (seenLocations.has(assignment.locationId)) {
					context.addIssue({
						code: 'custom',
						path: ['assignments', index, 'locationId'],
						message: 'Each location can only be assigned once.',
					})
				}
				seenLocations.add(assignment.locationId)
			}
		})
	})

export function userFormSchema(mode: 'create' | 'edit') {
	return accessSchema.safeExtend({
		username: z.string().trim().min(3, 'Username must be at least 3 characters').max(100),
		email: z
			.string()
			.trim()
			.max(255)
			.refine((value) => z.email().safeParse(value).success, {
				message: 'Invalid email address',
			}),
		name: z.string().trim().min(1, 'Name is required').max(255),
		password:
			mode === 'create'
				? z.string().min(8, 'Password must be at least 8 characters').max(100)
				: z.string().max(100),
		isActive: z.boolean(),
	})
}

export function createUserAssignment(): UserAssignmentFormValue {
	return { clientKey: crypto.randomUUID(), roleId: null, locationId: null }
}

export function emptyUserFormValues(): UserFormValues {
	return {
		username: '',
		email: '',
		name: '',
		password: '',
		isActive: true,
		assignmentMode: 'global',
		assignments: [],
	}
}

export function toUserFormValues(user: UserDetailDto): UserFormValues {
	return {
		username: user.username,
		email: user.email,
		name: user.name,
		password: '',
		isActive: user.isActive,
		assignmentMode: user.assignments.some((assignment) => assignment.locationId !== null)
			? 'per_location'
			: 'global',
		assignments: user.assignments.map(({ roleId, locationId }) => ({
			clientKey: crypto.randomUUID(),
			roleId,
			locationId,
		})),
	}
}

export function toUserCreateInput(values: UserFormValues): UserCreateDto {
	return UserCreateDto.parse({ ...values, email: values.email.trim() })
}

export function toUserUpdateInput(id: number, values: UserFormValues): UserUpdateDto {
	return UserUpdateDto.parse({ id, ...values, email: values.email.trim() })
}

export function toUserAssignments(values: UserFormValues): Omit<AssignmentCreateDto, 'userId'>[] {
	const access = accessSchema.parse(values)
	return access.assignments.map(({ roleId, locationId }) =>
		AssignmentCreateDto.omit({ userId: true }).parse({
			roleId,
			locationId: access.assignmentMode === 'global' ? null : locationId,
		}),
	)
}

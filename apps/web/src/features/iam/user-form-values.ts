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
			message: 'Pilih peran untuk penugasan ini.',
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
					message: 'Akses global tidak boleh menyertakan lokasi.',
				})
			}
			if (values.assignmentMode === 'per_location' && assignment.locationId === null) {
				context.addIssue({
					code: 'custom',
					path: ['assignments', index, 'locationId'],
					message: 'Pilih lokasi untuk penugasan ini.',
				})
			}
			if (values.assignmentMode === 'global' && assignment.roleId !== null) {
				if (seenRoles.has(assignment.roleId)) {
					context.addIssue({
						code: 'custom',
						path: ['assignments', index, 'roleId'],
						message: 'Peran ini sudah ditugaskan secara global.',
					})
				}
				seenRoles.add(assignment.roleId)
			} else if (assignment.locationId !== null) {
				if (seenLocations.has(assignment.locationId)) {
					context.addIssue({
						code: 'custom',
						path: ['assignments', index, 'locationId'],
						message: 'Setiap lokasi hanya dapat ditugaskan sekali.',
					})
				}
				seenLocations.add(assignment.locationId)
			}
		})
	})

export function userFormSchema(mode: 'create' | 'edit') {
	return accessSchema.safeExtend({
		username: z.string().trim().min(3, 'Nama pengguna minimal 3 karakter').max(100),
		email: z
			.string()
			.trim()
			.max(255)
			.refine((value) => z.email().safeParse(value).success, {
				message: 'Alamat email tidak valid',
			}),
		name: z.string().trim().min(1, 'Nama wajib diisi').max(255),
		password:
			mode === 'create'
				? z.string().min(8, 'Kata sandi minimal 8 karakter').max(100)
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

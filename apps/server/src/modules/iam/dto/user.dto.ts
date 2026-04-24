import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

import { LocationDto } from '@/modules/location'

import { UserAssignmentDto } from './assignment.dto'
import { RoleDto } from './role.dto'

/* ---------------------------------- ENTITY ---------------------------------- */

export const UserDto = z.object({
	...zc.RecordId.shape,
	email: zp.str,
	username: zp.str,
	fullname: zp.str,
	pinCode: zp.strNullable,
	isRoot: zp.bool,
	isSystem: zp.bool,
	isActive: zp.bool,
	defaultLocationId: zp.id.nullable(),
	...zc.AuditBasic.shape,
})
export type UserDto = z.infer<typeof UserDto>

export const UserAssignmentDetailDto = z.object({
	...UserAssignmentDto.omit({ roleId: true, locationId: true, userId: true }).shape,
	isDefault: zp.bool,
	role: RoleDto,
	location: LocationDto,
})
export type UserAssignmentDetailDto = z.infer<typeof UserAssignmentDetailDto>

export const UserDetailDto = z.object({
	...UserDto.shape,
	assignments: z.array(UserAssignmentDetailDto),
})
export type UserDetailDto = z.infer<typeof UserDetailDto>

/**
 * User Detail with Audit information.
 * Used for response schemas to include resolved audit metadata.
 */
export const UserDetailResolvedDto = z.object({
	...UserDetailDto.shape,
	...zc.AuditResolved.shape,
})
export type UserDetailResolvedDto = z.infer<typeof UserDetailResolvedDto>

/* -------------------------------- MUTATION -------------------------------- */

const UserMutationDto = z.object({
	email: zc.email,
	username: zc.username,
	fullname: zc.fullname,
	pinCode: zp.strNullable,
	isActive: zp.bool.default(true),
	isRoot: zp.bool.default(false),
	defaultLocationId: zp.id.nullable(),
	assignments: z.array(
		z.object({
			locationId: zp.id,
			roleId: zp.id,
		}),
	),
})

export const UserCreateDto = z.object({
	...UserMutationDto.shape,
	password: zc.password,
})
export type UserCreateDto = z.infer<typeof UserCreateDto>

export const UserUpdateDto = z.object({
	...zc.RecordId.shape,
	...UserMutationDto.shape,
	password: zc.password.optional(),
})
export type UserUpdateDto = z.infer<typeof UserUpdateDto>

/* --------------------------------- FILTER --------------------------------- */

export const UserFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	isActive: zq.boolean,
	isRoot: zq.boolean,
	locationId: zq.id.optional(),
})
export type UserFilterDto = z.infer<typeof UserFilterDto>

/* -------------------------------- PASSWORD -------------------------------- */

export const UserChangePasswordDto = z.object({
	oldPassword: zc.password,
	newPassword: zc.password,
})
export type UserChangePasswordDto = z.infer<typeof UserChangePasswordDto>

export const UserAdminUpdatePasswordDto = z.object({
	...zc.RecordId.shape,
	password: zc.password,
})
export type UserAdminUpdatePasswordDto = z.infer<typeof UserAdminUpdatePasswordDto>

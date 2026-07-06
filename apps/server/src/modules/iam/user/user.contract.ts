import { z } from 'zod'

import { zc, zp } from '@/shared/schema'

/* --------------------------------- ENTITY --------------------------------- */

export const UserDto = z.object({
	id: zp.id,
	email: zp.str,
	username: zp.str,
	fullname: zp.str,
	pinCode: zp.str.nullable(),
	isRoot: zp.bool,
	isSystem: zp.bool,
	isActive: zp.bool,
	defaultLocationId: zp.id.nullable(),
	...zc.AuditBasic.shape,
})
export type UserDto = z.infer<typeof UserDto>

/**
 * Internal persistence shape — includes `passwordHash`. NOT an HTTP response
 * DTO; never return this from a route. Used only by the auth/user service and
 * repo layers.
 */
export const UserWithPasswordDto = z.object({
	...UserDto.shape,
	passwordHash: zp.str.nullable(),
})
export type UserWithPasswordDto = z.infer<typeof UserWithPasswordDto>

/* ---------------------------------- HTTP ---------------------------------- */

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
	id: zp.id,
	...UserMutationDto.shape,
	password: zc.password.optional(),
})
export type UserUpdateDto = z.infer<typeof UserUpdateDto>

/* -------------------------------- PASSWORD -------------------------------- */

export const UserChangePasswordDto = z.object({
	oldPassword: zc.password,
	newPassword: zc.password,
})
export type UserChangePasswordDto = z.infer<typeof UserChangePasswordDto>

export const UserAdminUpdatePasswordDto = z.object({
	id: zp.id,
	password: zc.password,
})
export type UserAdminUpdatePasswordDto = z.infer<typeof UserAdminUpdatePasswordDto>

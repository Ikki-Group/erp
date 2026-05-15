import { z } from 'zod'

import { zc, zp, zq } from '@/shared/validation'

/* ---------------------------------- BASE ---------------------------------- */

export const UserSchema = z.object({
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
export type UserSchema = z.infer<typeof UserSchema>

/* -------------------------------- MUTATION -------------------------------- */

const UserMutationSchema = z.object({
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

export const UserCreateSchema = z.object({
	...UserMutationSchema.shape,
	password: zc.password,
})
export type UserCreateSchema = z.infer<typeof UserCreateSchema>

export const UserUpdateSchema = z.object({
	...zc.RecordId.shape,
	...UserMutationSchema.shape,
	password: zc.password.optional(),
})
export type UserUpdateSchema = z.infer<typeof UserUpdateSchema>

/* --------------------------------- FILTER --------------------------------- */

export const UserFilterSchema = z.object({
	...zq.pagination.shape,
	q: zq.search,
	isActive: zq.boolean.optional(),
	isRoot: zq.boolean.optional(),
	locationId: zq.id.optional(),
})
export type UserFilterSchema = z.infer<typeof UserFilterSchema>

/* -------------------------------- PASSWORD -------------------------------- */

export const UserChangePasswordSchema = z.object({
	oldPassword: zc.password,
	newPassword: zc.password,
})
export type UserChangePasswordSchema = z.infer<typeof UserChangePasswordSchema>

export const UserAdminUpdatePasswordSchema = z.object({
	...zc.RecordId.shape,
	password: zc.password,
})
export type UserAdminUpdatePasswordSchema = z.infer<typeof UserAdminUpdatePasswordSchema>

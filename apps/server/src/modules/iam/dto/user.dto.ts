import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

import { LocationDto } from '@/modules/location'

import { UserAssignmentDto, UserAssignmentUpsertDto } from './assignment.dto'
import { RoleDto } from './role.dto'

/* ---------------------------------- ENTITY ---------------------------------- */

export const UserDto = z.object({
	...zc.RecordId.shape,
	email: zp.str,
	username: zp.str,
	fullname: zp.str,
	pinCode: zp.strNullable,
	isRoot: zp.bool,
	isActive: zp.bool,
	...zc.AuditBasic.shape,
})
export type UserDto = z.infer<typeof UserDto>

export const UserAssignmentDetailDto = z.object({
	...UserAssignmentDto.shape,
	role: RoleDto,
	location: LocationDto,
})
export type UserAssignmentDetailDto = z.infer<typeof UserAssignmentDetailDto>

export const UserDetailDto = z.object({
	...UserDto.shape,
	assignments: z.array(UserAssignmentDetailDto),
})
export type UserDetailDto = z.infer<typeof UserDetailDto>

/* -------------------------------- MUTATION -------------------------------- */

const UserMutationDto = z.object({
	email: zc.email,
	username: zc.username,
	fullname: zc.fullname,
	pinCode: zp.strNullable,
	isActive: zp.bool.default(true),
})

export const UserCreateDto = UserMutationDto.extend({
	password: zc.password,
	assignments: z.array(UserAssignmentUpsertDto).default([]),
})
export type UserCreateDto = z.infer<typeof UserCreateDto>

export const UserUpdateDto = UserMutationDto.extend({
	...zc.RecordId.shape,
	password: zc.password.optional(),
	assignments: z.array(UserAssignmentUpsertDto).optional(),
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

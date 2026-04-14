import {
	zBool,
	zEmail,
	zMetadataDto,
	zPaginationDto,
	zPassword,
	zQuerySearch,
	zRecordIdDto,
	zStr,
	zUsername,
} from '@/lib/zod'

import { UserAssignmentDetailDto, UserAssignmentUpsertDto } from './user-assignment.dto'

import { z } from 'zod'

/**
 * Common User attributes.
 */
export const UserBaseDto = z.object({
	username: zUsername,
	email: zEmail,
	fullname: zStr,
	isActive: zBool,
	isRoot: zBool,
	assignments: z.array(UserAssignmentDetailDto).optional(),
})
export type UserBaseDto = z.infer<typeof UserBaseDto>

/**
 * User database record (includes related assignments).
 */
export const UserDto = z.object({
	...zRecordIdDto.shape,
	...UserBaseDto.shape,
	...zMetadataDto.shape,
})
export type UserDto = z.infer<typeof UserDto>

export const UserSelectDto = z.object({ ...UserDto.shape })
export type UserSelectDto = z.infer<typeof UserSelectDto>

/**
 * Input for creating a new User.
 */
export const UserCreateDto = z.object({
	...UserBaseDto.omit({ assignments: true }).shape,
	password: zPassword,
	assignments: z.array(UserAssignmentUpsertDto).default([]),
})
export type UserCreateDto = z.infer<typeof UserCreateDto>

/**
 * Input for updating an existing User (Full Update).
 */
export const UserUpdateDto = z.object({
	...zRecordIdDto.shape,
	...UserCreateDto.omit({ password: true }).shape,
	password: zPassword.optional(),
})
export type UserUpdateDto = z.infer<typeof UserUpdateDto>

/**
 * Filter criteria for listing Users.
 */
export const UserFilterDto = z.object({
	...zPaginationDto.shape,
	q: zQuerySearch,
	isActive: zBool.optional(),
	locationId: z.coerce.number().optional(),
})
export type UserFilterDto = z.infer<typeof UserFilterDto>

/**
 * Password change DTO for current user.
 */
export const UserChangePasswordDto = z.object({ oldPassword: zPassword, newPassword: zPassword })
export type UserChangePasswordDto = z.infer<typeof UserChangePasswordDto>

/**
 * Administrative password reset.
 */
export const UserAdminUpdatePasswordDto = z.object({ ...zRecordIdDto.shape, password: zPassword })
export type UserAdminUpdatePasswordDto = z.infer<typeof UserAdminUpdatePasswordDto>

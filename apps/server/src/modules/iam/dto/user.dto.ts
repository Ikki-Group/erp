import { z } from 'zod'

import {
	zBool,
	zEmail,
	zMetadataDto,
	zPaginationDto,
	zPassword,
	zQueryBoolean,
	zQuerySearch,
	zRecordIdDto,
	zStr,
	zUsername,
} from '@/core/validation'

import { UserAssignmentDetailDto, UserAssignmentUpsertDto } from './user-assignment.dto'

/**
 * Common User attributes.
 */
export const UserBaseDto = z.object({
	username: zUsername,
	email: zEmail,
	fullname: zStr,
	isActive: zBool,
	isRoot: zBool,
})
export type UserBaseDto = z.infer<typeof UserBaseDto>

/**
 * User database record (includes related assignments).
 */
export const UserDto = z.object({
	...zRecordIdDto.shape,
	...UserBaseDto.shape,
	...zMetadataDto.shape,
	assignments: z.array(UserAssignmentDetailDto).optional(),
})
export type UserDto = z.infer<typeof UserDto>

/**
 * Input for creating a new User.
 */
export const UserCreateDto = z.object({
	...UserBaseDto.shape,
	password: zPassword,
	assignments: z.array(UserAssignmentUpsertDto).default([]),
})
export type UserCreateDto = z.infer<typeof UserCreateDto>

/**
 * Input for updating an existing User (Full Update).
 */
export const UserUpdateDto = z.object({
	...zRecordIdDto.shape,
	...UserBaseDto.shape,
	password: zPassword.optional(),
	assignments: z.array(UserAssignmentUpsertDto).optional(),
})
export type UserUpdateDto = z.infer<typeof UserUpdateDto>

/**
 * Filter criteria for listing Users.
 */
export const UserFilterDto = z.object({
	...zPaginationDto.shape,
	q: zQuerySearch,
	isActive: zQueryBoolean,
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

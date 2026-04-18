import { z } from 'zod'

import {
	zBool,
	zEmail,
	zMetadataDto,
	zPaginationDto,
	zPassword,
	zQueryBoolean,
	zQueryId,
	zQuerySearch,
	zRecordIdDto,
	zStr,
	zStrNullable,
	zUsername,
	zAuditResolvedDto,
} from '@/core/validation'

import { UserAssignmentDetailDto, UserAssignmentUpsertDto } from './assignment.dto'

export const UserBaseDto = z.object({
	email: zEmail,
	username: zUsername,
	fullname: zStr,
	pinCode: zStrNullable,
	isRoot: zBool,
	isActive: zBool,
})
export type UserBaseDto = z.infer<typeof UserBaseDto>

export const UserDto = z.object({
	...zRecordIdDto.shape,
	...UserBaseDto.shape,
	...zMetadataDto.shape,
})
export type UserDto = z.infer<typeof UserDto>

export const UserDetailDto = z.object({
	...UserDto.shape,
	assignments: z.array(UserAssignmentDetailDto),
	...zAuditResolvedDto.shape,
})

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
	isRoot: zQueryBoolean,
	locationId: zQueryId.optional(),
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

import { z } from 'zod'

import { zBool, zEmail, zId, zMetadataDto, zPaginationDto, zPassword, zStr, zStrNullable, zUsername } from '@/core/validation'

import { UserAssignmentDetail, UserAssignmentUpsert } from './user-assignment.dto'

/**
 * Common User attributes.
 */
export const UserBase = z.object({
  email: zEmail,
  username: zUsername,
  fullname: zStr,
  pinCode: zStrNullable.optional(),
  isRoot: zBool,
  isActive: zBool,
})
export type UserBase = z.infer<typeof UserBase>

/**
 * User database record.
 */
export const User = z.object({
  ...zId.shape,
  ...UserBase.shape,
  ...zMetadataDto.shape,
  assignments: z.array(UserAssignmentDetail).optional(),
})
export type User = z.infer<typeof User>

/**
 * Input for creating a new User.
 */
export const UserCreate = z.object({
  ...UserBase.shape,
  password: zPassword,
  assignments: z.array(UserAssignmentUpsert).default([]),
})
export type UserCreate = z.infer<typeof UserCreate>

/**
 * Input for updating an existing User (Full Update).
 */
export const UserUpdate = z.object({
  ...zId.shape,
  ...UserBase.shape,
  password: zPassword.optional(),
  assignments: z.array(UserAssignmentUpsert).optional(),
})
export type UserUpdate = z.infer<typeof UserUpdate>

/**
 * Filter criteria for listing Users.
 */
export const UserFilter = z.object({
  ...zPaginationDto.shape,
  q: z.string().optional(),
  isActive: z.boolean().optional(),
})
export type UserFilter = z.infer<typeof UserFilter>

/**
 * Input for user self-password change.
 */
export const UserChangePassword = z.object({
  oldPassword: zPassword,
  newPassword: zPassword,
})
export type UserChangePassword = z.infer<typeof UserChangePassword>

/**
 * Input for administrative password reset.
 */
export const UserAdminUpdatePassword = z.object({
  id: zId,
  password: zPassword,
})
export type UserAdminUpdatePassword = z.infer<typeof UserAdminUpdatePassword>

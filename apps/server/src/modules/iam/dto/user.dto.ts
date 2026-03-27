import z from 'zod'

import { zStr, zBool, zId, zEmail, zPassword, zUsername, zQuerySearch, zQueryBoolean, zMetadataSchema } from '@/core/validation'

import { UserAssignmentDetailDto, UserAssignmentUpsertDto } from './user-assignment.dto'

/* ---------------------------------- BASE ---------------------------------- */

export const UserBase = z.object({
  email: zEmail,
  username: zUsername,
  fullname: zStr,
  isRoot: zBool,
  isActive: zBool,
})

/* --------------------------------- ENTITY --------------------------------- */

export const UserDto = z.object({
  id: zId,
  ...UserBase.shape,
  passwordHash: zStr,
  ...zMetadataSchema.shape,
})

export type UserDto = z.infer<typeof UserDto>

/* --------------------------------- FILTER --------------------------------- */

export const UserFilterDto = z.object({ search: zQuerySearch, isActive: zQueryBoolean })

export type UserFilterDto = z.infer<typeof UserFilterDto>

/* --------------------------------- OUTPUT --------------------------------- */

export const UserOutputDto = z.object({
  id: zId,
  ...UserBase.shape,
  assignments: z.array(UserAssignmentDetailDto),
  ...zMetadataSchema.shape,
})

export type UserOutputDto = z.infer<typeof UserOutputDto>

/* --------------------------------- CREATE --------------------------------- */

export const UserCreateDto = z.object({
  ...UserBase.shape,
  password: zPassword,
  assignments: z.array(UserAssignmentUpsertDto).default([]),
})

export type UserCreateDto = z.infer<typeof UserCreateDto>

/* --------------------------------- UPDATE --------------------------------- */

export const UserUpdateDto = z.object({
  ...UserBase.shape,
  password: zPassword.optional(),
  assignments: z.array(UserAssignmentUpsertDto).optional(),
})

export type UserUpdateDto = z.infer<typeof UserUpdateDto>

/* ------------------------------ SPECIALIZED ------------------------------- */

export const UserChangePasswordDto = z.object({ oldPassword: zPassword, newPassword: zPassword })

export type UserChangePasswordDto = z.infer<typeof UserChangePasswordDto>

export const UserAdminUpdatePasswordDto = z.object({ id: zId, password: zPassword })

export type UserAdminUpdatePasswordDto = z.infer<typeof UserAdminUpdatePasswordDto>

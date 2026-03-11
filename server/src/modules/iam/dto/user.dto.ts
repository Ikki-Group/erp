import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/core/validation'

import { UserAssignmentDetailDto, UserAssignmentUpsertDto } from './user-assignment.dto'

/* ---------------------------------- BASE ---------------------------------- */

export const UserBase = z.object({
  email: zPrimitive.email,
  username: zPrimitive.username,
  fullname: zPrimitive.str,
  isRoot: zPrimitive.bool,
  isActive: zPrimitive.bool,
})

/* --------------------------------- ENTITY --------------------------------- */

export const UserDto = z.object({
  id: zPrimitive.id,
  ...UserBase.shape,
  passwordHash: zPrimitive.str,
  ...zSchema.metadata.shape,
})

export type UserDto = z.infer<typeof UserDto>

/* --------------------------------- FILTER --------------------------------- */

export const UserFilterDto = z.object({
  search: zHttp.query.search,
  isActive: zHttp.query.boolean,
})

export type UserFilterDto = z.infer<typeof UserFilterDto>

/* --------------------------------- OUTPUT --------------------------------- */

export const UserOutputDto = z.object({
  id: zPrimitive.id,
  ...UserBase.shape,
  assignments: z.array(UserAssignmentDetailDto),
  ...zSchema.metadata.shape,
})

export type UserOutputDto = z.infer<typeof UserOutputDto>

/* --------------------------------- CREATE --------------------------------- */

export const UserCreateDto = z.object({
  ...UserBase.shape,
  password: zPrimitive.password,
  assignments: z.array(UserAssignmentUpsertDto).default([]),
})

export type UserCreateDto = z.infer<typeof UserCreateDto>

/* --------------------------------- UPDATE --------------------------------- */

export const UserUpdateDto = z.object({
  ...UserBase.shape,
  password: zPrimitive.password.optional(),
  assignments: z.array(UserAssignmentUpsertDto).optional(),
})

export type UserUpdateDto = z.infer<typeof UserUpdateDto>

/* ------------------------------ SPECIALIZED ------------------------------- */

export const UserChangePasswordDto = z.object({
  oldPassword: zPrimitive.password,
  newPassword: zPrimitive.password,
})

export type UserChangePasswordDto = z.infer<typeof UserChangePasswordDto>

export const UserAdminUpdatePasswordDto = z.object({
  id: zPrimitive.id,
  password: zPrimitive.password,
})

export type UserAdminUpdatePasswordDto = z.infer<typeof UserAdminUpdatePasswordDto>

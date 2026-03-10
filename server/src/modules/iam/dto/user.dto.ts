import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

import { UserAssignmentDetailDto, UserAssignmentUpsertDto } from './user-assignments.dto'

/* --------------------------------- ENTITY --------------------------------- */

export const UserDto = z.object({
  id: zPrimitive.id,
  email: zPrimitive.email,
  username: zPrimitive.username,
  fullname: zPrimitive.str,
  passwordHash: zPrimitive.str,
  isRoot: zPrimitive.bool,
  isActive: zPrimitive.bool,
  ...zSchema.metadata.shape,
})

export type UserDto = z.infer<typeof UserDto>

/* --------------------------------- COMMON --------------------------------- */

export const UserFilterDto = z.object({
  search: zHttp.query.search,
  isActive: zHttp.query.boolean,
})

export type UserFilterDto = z.infer<typeof UserFilterDto>

export const UserSelectDto = z.object({
  ...UserDto.omit({ passwordHash: true }).shape,
  assignments: z.array(UserAssignmentDetailDto),
})

export type UserSelectDto = z.infer<typeof UserSelectDto>

/* --------------------------------- MUTATION --------------------------------- */

export const UserCreateDto = z.object({
  ...UserDto.pick({
    email: true,
    username: true,
    fullname: true,
    isRoot: true,
    isActive: true,
  }).shape,
  assignments: z.array(UserAssignmentUpsertDto).default([]),
  password: zPrimitive.password,
})

export type UserCreateDto = z.infer<typeof UserCreateDto>

export const UserUpdateDto = z.object({
  ...UserCreateDto.omit({ password: true }).shape,
  password: zPrimitive.password.optional(),
})

export type UserUpdateDto = z.infer<typeof UserUpdateDto>

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

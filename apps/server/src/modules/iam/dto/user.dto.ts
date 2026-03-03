import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

import { LocationDto } from '@/modules/location'

import { RoleDto } from './role.dto'

/* --------------------------------- ENTITY --------------------------------- */

/** Represents a user-role-location assignment (from the `user_assignments` junction table). */
export const UserAssignmentDto = z.object({
  id: zPrimitive.id,
  locationId: zPrimitive.id,
  roleId: zPrimitive.id,
  isDefault: zPrimitive.bool,
})

export type UserAssignmentDto = z.infer<typeof UserAssignmentDto>

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

export const UserAssignmentDetailDto = z.object({
  ...UserAssignmentDto.shape,
  location: LocationDto,
  role: RoleDto,
})

export type UserAssignmentDetailDto = z.infer<typeof UserAssignmentDetailDto>

export const UserSelectDto = z.object({
  ...UserDto.omit({ passwordHash: true }).shape,
  assignments: z.array(UserAssignmentDetailDto),
})

export type UserSelectDto = z.infer<typeof UserSelectDto>

/* --------------------------------- MUTATION --------------------------------- */

export const UserCreateDto = z.object({
  email: zPrimitive.email,
  username: zPrimitive.username,
  fullname: zPrimitive.str,
  password: zPrimitive.password,
  isActive: zPrimitive.bool,
  isRoot: zPrimitive.bool,
  /** Assignment list to create in the junction table */
  assignments: z
    .array(
      z.object({
        roleId: zPrimitive.id,
        locationId: zPrimitive.id,
        isDefault: zPrimitive.bool.default(false),
      })
    )
    .default([]),
})

export type UserCreateDto = z.infer<typeof UserCreateDto>

export const UserUpdateDto = UserCreateDto.partial()

export type UserUpdateDto = z.infer<typeof UserUpdateDto>

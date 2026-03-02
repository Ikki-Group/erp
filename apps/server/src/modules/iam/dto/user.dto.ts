import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

import { RoleDto } from './role.dto'

/* --------------------------------- ENTITY --------------------------------- */

export const UserAssignmentDto = z.object({
  locationId: zPrimitive.objId,
  roleId: zPrimitive.objId,
  isDefault: zPrimitive.bool,
})

export type UserAssignmentDto = z.infer<typeof UserAssignmentDto>

export const UserDto = z.object({
  id: zPrimitive.objId,
  email: zPrimitive.email,
  username: zPrimitive.username,
  fullname: zPrimitive.str,
  passwordHash: zPrimitive.str,
  isRoot: zPrimitive.bool,
  isActive: zPrimitive.bool,
  assignments: UserAssignmentDto.array(),
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
})

export type UserSelectDto = z.infer<typeof UserSelectDto>

export const UserDetailDto = z.object({
  ...UserSelectDto.shape,
  assignments: z.array(
    z.object({
      ...UserAssignmentDto.shape,
      // TODO
      location: z.unknown(),
      role: RoleDto,
    })
  ),
})

export type UserDetailDto = z.infer<typeof UserDetailDto>

/* --------------------------------- MUTATION --------------------------------- */

export const UserMutationDto = z.object({
  ...UserDto.pick({
    email: true,
    username: true,
    fullname: true,
    isActive: true,
    isRoot: true,
    assignments: true,
  }).shape,
  password: zPrimitive.password,
})

export type UserMutationDto = z.infer<typeof UserMutationDto>

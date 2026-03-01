import z from 'zod'

import { zPrimitive, zSchema } from '@/lib/validation'

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

export const UserSelectDto = z.object({
  ...UserDto.omit({ passwordHash: true }).shape,
})

export type UserSelectDto = z.infer<typeof UserSelectDto>

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

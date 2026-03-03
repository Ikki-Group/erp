import z from 'zod'
import { RoleDto } from './role.dto'
import { LocationDto } from '@/features/location'
import { zHttp, zPrimitive, zSchema } from '@/lib/zod'

/* --------------------------------- ENTITY --------------------------------- */

export const UserAssignmentDto = z.object({
  id: zPrimitive.id,
  locationId: zPrimitive.id,
  roleId: zPrimitive.id,
  isDefault: zPrimitive.bool,
})

export type UserAssignmentDto = z.infer<typeof UserAssignmentDto>

export const UserAssignmentDetailDto = z.object({
  ...UserAssignmentDto.shape,
  location: LocationDto,
  role: RoleDto,
})

export type UserAssignmentDetailDto = z.infer<typeof UserAssignmentDetailDto>

export const UserSelectDto = z.object({
  id: zPrimitive.id,
  email: zPrimitive.str,
  username: zPrimitive.str,
  fullname: zPrimitive.str,
  isRoot: zPrimitive.bool,
  isActive: zPrimitive.bool,
  assignments: z.array(UserAssignmentDetailDto),
  ...zSchema.meta.shape,
})

export type UserSelectDto = z.infer<typeof UserSelectDto>

/* -------------------------------- MUTATION -------------------------------- */

export const UserMutationDto = z.object({
  email: zPrimitive.str,
  username: zPrimitive.str,
  fullname: zPrimitive.str,
  isRoot: zPrimitive.bool,
  isActive: zPrimitive.bool,
  password: zPrimitive.str,
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

export type UserMutationDto = z.infer<typeof UserMutationDto>

/* --------------------------------- FILTER --------------------------------- */

export const UserFilterDto = z.object({
  search: zHttp.search,
  isActive: zHttp.boolean,
})

export type UserFilterDto = z.infer<typeof UserFilterDto>

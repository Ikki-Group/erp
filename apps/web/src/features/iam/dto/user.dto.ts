import z from 'zod'
import { RoleDto } from './role.dto'
import { LocationDto } from '@/features/location'
import { zHttp, zPrimitive, zSchema } from '@/lib/zod'

export const UserSelectDto = z.object({
  id: zPrimitive.str,
  email: zPrimitive.str,
  username: zPrimitive.str,
  fullname: zPrimitive.str,
  isRoot: zPrimitive.bool,
  isActive: zPrimitive.bool,
  assignments: z.array(
    z.object({
      isDefault: zPrimitive.bool,
      roleId: zPrimitive.str,
      locationId: zPrimitive.str,
      role: RoleDto,
      location: LocationDto,
    })
  ),
  ...zSchema.meta.shape,
})

export type UserSelectDto = z.infer<typeof UserSelectDto>

export const UserMutationDto = z.object({
  email: zPrimitive.str,
  username: zPrimitive.str,
  fullname: zPrimitive.str,
  isRoot: zPrimitive.bool,
  isActive: zPrimitive.bool,
  password: zPrimitive.str,
  assignments: z.array(
    z.object({
      locationId: zPrimitive.str,
      roleId: zPrimitive.str,
    })
  ),
})

export type UserMutationDto = z.infer<typeof UserMutationDto>

/* --------------------------------- COMMON --------------------------------- */

export const UserFilterDto = z.object({
  search: zHttp.search,
  isActive: zHttp.boolean,
})

export type UserFilterDto = z.infer<typeof UserFilterDto>

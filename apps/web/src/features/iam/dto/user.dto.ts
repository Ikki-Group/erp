import z from 'zod'
import { RoleDto } from './role.dto'
import { LocationDto } from '@/features/location'
import { zPrimitive, zSchema } from '@/lib/zod'

export const UserDto = z.object({
  id: zPrimitive.num,
  email: zPrimitive.str,
  fullname: zPrimitive.str,
  username: zPrimitive.str,
  isRoot: zPrimitive.bool,
  isActive: zPrimitive.bool,
  ...zSchema.meta.shape,
})

export type UserDto = z.infer<typeof UserDto>

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

export const UserDetailAssignmentDto = z.object({
  isDefault: zPrimitive.bool,
  role: RoleDto.pick({ id: true, name: true, code: true }),
  location: LocationDto,
})

export type UserDetailAssignmentDto = z.infer<typeof UserDetailAssignmentDto>

export const UserDetailDto = z.object({
  ...UserDto.shape,
  assignments: z.array(UserDetailAssignmentDto),
})

export type UserDetailDto = z.infer<typeof UserDetailDto>

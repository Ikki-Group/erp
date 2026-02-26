import { zPrimitive, zSchema } from '@/lib/zod'
import z from 'zod'

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
    }),
  ),
})

export type UserMutationDto = z.infer<typeof UserMutationDto>

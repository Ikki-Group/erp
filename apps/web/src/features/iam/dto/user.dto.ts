import { zPrimitive, zSchema } from '@/lib/zod'
import z from 'zod'

export const UserDto = z.object({
  id: zPrimitive.num,
  email: zPrimitive.str,
  username: zPrimitive.str,
  fullname: zPrimitive.str,
  isRoot: zPrimitive.bool,
  isActive: zPrimitive.bool,
  ...zSchema.meta.shape,
})

export type UserDto = z.infer<typeof UserDto>

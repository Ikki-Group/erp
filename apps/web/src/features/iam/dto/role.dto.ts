import { zSchema, zPrimitive } from '@/lib/zod'
import z from 'zod'

export const RoleDto = z.object({
  id: zPrimitive.num,
  code: zPrimitive.str,
  name: zPrimitive.str,
  isSystem: zPrimitive.bool,
  ...zSchema.meta.shape,
})

export type RoleDto = z.infer<typeof RoleDto>

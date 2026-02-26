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

export const RoleMutationDto = z.object({
  code: zPrimitive.str,
  name: zPrimitive.str,
  isSystem: zPrimitive.bool.default(false),
})

export type RoleMutationDto = z.infer<typeof RoleMutationDto>

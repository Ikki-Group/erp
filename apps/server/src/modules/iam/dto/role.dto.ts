import z from 'zod'

import { zPrimitive, zSchema } from '@/lib/validation'

export const RoleDto = z.object({
  id: zPrimitive.objId,
  code: zPrimitive.str,
  name: zPrimitive.str,
  isSystem: zPrimitive.bool,
  ...zSchema.metadata.shape,
})

export type RoleDto = z.infer<typeof RoleDto>

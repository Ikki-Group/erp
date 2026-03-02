import z from 'zod'
import { zHttp, zPrimitive, zSchema } from '@/lib/zod'

/* --------------------------------- ENTITY --------------------------------- */

export const RoleDto = z.object({
  id: zPrimitive.str,
  code: zPrimitive.str,
  name: zPrimitive.str,
  isSystem: zPrimitive.bool,
  ...zSchema.metadata.shape,
})

export type RoleDto = z.infer<typeof RoleDto>

/* --------------------------------- COMMON --------------------------------- */

export const RoleFilterDto = z.object({
  search: zHttp.search,
})

export type RoleFilterDto = z.infer<typeof RoleFilterDto>

/* --------------------------------- MUTATION --------------------------------- */

export const RoleMutationDto = z.object({
  code: zPrimitive.str,
  name: zPrimitive.str,
  isSystem: zPrimitive.bool.default(false),
})

export type RoleMutationDto = z.infer<typeof RoleMutationDto>

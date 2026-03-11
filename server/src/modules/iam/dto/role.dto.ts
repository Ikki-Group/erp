import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const RoleDto = z.object({
  id: zPrimitive.id,
  code: zPrimitive.str,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  isSystem: zPrimitive.bool,
  ...zSchema.metadata.shape,
})

export type RoleDto = z.infer<typeof RoleDto>

/* --------------------------------- FILTER --------------------------------- */

export const RoleFilterDto = z.object({
  search: zHttp.query.search,
})

export type RoleFilterDto = z.infer<typeof RoleFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const RoleMutationDto = z.object({
  ...RoleDto.pick({
    code: true,
    name: true,
    isSystem: true,
  }).shape,
})

export type RoleMutationDto = z.infer<typeof RoleMutationDto>

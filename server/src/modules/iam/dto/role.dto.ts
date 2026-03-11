import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/core/validation'

/* ---------------------------------- BASE ---------------------------------- */

export const RoleBase = z.object({
  code: zPrimitive.str,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  isSystem: zPrimitive.bool,
})

/* --------------------------------- ENTITY --------------------------------- */

export const RoleDto = z.object({
  id: zPrimitive.id,
  ...RoleBase.shape,
  ...zSchema.metadata.shape,
})

export type RoleDto = z.infer<typeof RoleDto>

/* --------------------------------- FILTER --------------------------------- */

export const RoleFilterDto = z.object({
  search: zHttp.query.search,
})

export type RoleFilterDto = z.infer<typeof RoleFilterDto>

/* --------------------------------- CREATE --------------------------------- */

export const RoleCreateDto = z.object({
  ...RoleBase.shape,
})

export type RoleCreateDto = z.infer<typeof RoleCreateDto>

/* --------------------------------- UPDATE --------------------------------- */

export const RoleUpdateDto = z.object({
  ...RoleBase.shape,
})

export type RoleUpdateDto = z.infer<typeof RoleUpdateDto>

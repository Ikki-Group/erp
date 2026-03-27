import z from 'zod'

import { zStrNullable, zStr, zBool, zId, zQuerySearch, zMetadataSchema } from '@/core/validation'

/* ---------------------------------- BASE ---------------------------------- */

export const RoleBase = z.object({
  code: zStr,
  name: zStr,
  description: zStrNullable,
  isSystem: zBool,
})

/* --------------------------------- ENTITY --------------------------------- */

export const RoleDto = z.object({ id: zId, ...RoleBase.shape, ...zMetadataSchema.shape })

export type RoleDto = z.infer<typeof RoleDto>

/* --------------------------------- FILTER --------------------------------- */

export const RoleFilterDto = z.object({ search: zQuerySearch })

export type RoleFilterDto = z.infer<typeof RoleFilterDto>

/* --------------------------------- CREATE --------------------------------- */

export const RoleCreateDto = z.object({ ...RoleBase.shape })

export type RoleCreateDto = z.infer<typeof RoleCreateDto>

/* --------------------------------- UPDATE --------------------------------- */

export const RoleUpdateDto = z.object({ ...RoleBase.shape })

export type RoleUpdateDto = z.infer<typeof RoleUpdateDto>

import z from 'zod'

import { zStrNullable, zStr, zBool, zId, zQuerySearch, zMetadataDto } from '@/core/validation'

/* ---------------------------------- BASE ---------------------------------- */

export const RoleBaseDto = z.object({
  code: zStr,
  name: zStr,
  description: zStrNullable,
  permissions: z.string().array(),
  isSystem: zBool,
})

export type RoleBaseDto = z.infer<typeof RoleBaseDto>

/* --------------------------------- ENTITY --------------------------------- */

export const RoleDto = z.object({
  id: zId,
  ...RoleBaseDto.shape,
  ...zMetadataDto.shape,
})

export type RoleDto = z.infer<typeof RoleDto>

/* --------------------------------- FILTER --------------------------------- */

export const RoleFilterDto = z.object({ search: zQuerySearch })

export type RoleFilterDto = z.infer<typeof RoleFilterDto>

/* --------------------------------- CREATE --------------------------------- */

export const RoleCreateDto = RoleBaseDto

export type RoleCreateDto = z.infer<typeof RoleCreateDto>

/* --------------------------------- UPDATE --------------------------------- */

export const RoleUpdateDto = RoleBaseDto

export type RoleUpdateDto = z.infer<typeof RoleUpdateDto>

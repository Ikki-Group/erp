import z from 'zod'

import { zStr, zBool, zId, zQuerySearch, zMetadataDto } from '@/core/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const salesTypeSchema = z
  .object({
    id: zId,
    code: zStr,
    name: zStr,
    isSystem: zBool,
  })
  .extend(zMetadataDto.shape)

export type SalesTypeDto = z.infer<typeof salesTypeSchema>

/* --------------------------------- FILTER --------------------------------- */

export const salesTypeFilterSchema = z.object({ search: zQuerySearch })

export type SalesTypeFilterDto = z.infer<typeof salesTypeFilterSchema>

/* -------------------------------- MUTATION -------------------------------- */

export const salesTypeMutationSchema = salesTypeSchema.pick({
  code: true,
  name: true,
  isSystem: true,
})

export type SalesTypeMutationDto = z.infer<typeof salesTypeMutationSchema>

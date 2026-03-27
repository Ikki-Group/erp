import z from 'zod'

import { zStrNullable, zStr, zId, zQuerySearch, zMetadataDto } from '@/core/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialCategoryDto = z.object({
  id: zId,
  name: zStr,
  description: zStrNullable,
  ...zMetadataDto.shape,
})

export type MaterialCategoryDto = z.infer<typeof MaterialCategoryDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialCategoryFilterDto = z.object({ search: zQuerySearch })

export type MaterialCategoryFilterDto = z.infer<typeof MaterialCategoryFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialCategoryMutationDto = z.object({
  ...MaterialCategoryDto.pick({
    name: true,
    description: true,
  }).shape,
})

export type MaterialCategoryMutationDto = z.infer<typeof MaterialCategoryMutationDto>

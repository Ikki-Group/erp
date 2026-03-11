import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/core/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialCategoryDto = z.object({
  id: zPrimitive.id,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  ...zSchema.metadata.shape,
})

export type MaterialCategoryDto = z.infer<typeof MaterialCategoryDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialCategoryFilterDto = z.object({
  search: zHttp.query.search,
})

export type MaterialCategoryFilterDto = z.infer<typeof MaterialCategoryFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialCategoryMutationDto = z.object({
  ...MaterialCategoryDto.pick({
    name: true,
    description: true,
  }).shape,
})

export type MaterialCategoryMutationDto = z.infer<typeof MaterialCategoryMutationDto>

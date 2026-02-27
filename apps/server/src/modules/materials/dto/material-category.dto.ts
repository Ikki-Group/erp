import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialCategoryDto = z.object({
  id: zPrimitive.idNum,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  ...zSchema.meta.shape,
})

export type MaterialCategoryDto = z.infer<typeof MaterialCategoryDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialCategoryFilterDto = z.object({
  search: zHttp.query.search,
})

export type MaterialCategoryFilterDto = z.infer<typeof MaterialCategoryFilterDto>

/* --------------------------------- MUTATION --------------------------------- */

export const MaterialCategoryCreateDto = z.object({
  ...MaterialCategoryDto.pick({
    name: true,
    description: true,
  }).shape,
})

export type MaterialCategoryCreateDto = z.infer<typeof MaterialCategoryCreateDto>

export const MaterialCategoryUpdateDto = z.object({
  id: zPrimitive.idNum,
  ...MaterialCategoryCreateDto.shape,
})

export type MaterialCategoryUpdateDto = z.infer<typeof MaterialCategoryUpdateDto>

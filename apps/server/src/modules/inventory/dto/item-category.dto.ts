import z from 'zod'

import { zPrimitive, zSchema } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const ItemCategoryDto = z.object({
  id: zPrimitive.idNum,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  ...zSchema.meta.shape,
})

export type ItemCategoryDto = z.infer<typeof ItemCategoryDto>

/* --------------------------------- FILTER --------------------------------- */

export const ItemCategoryFilterDto = z.object({
  name: zPrimitive.strNullable,
})

export type ItemCategoryFilterDto = z.infer<typeof ItemCategoryFilterDto>

/* --------------------------------- MUTATION --------------------------------- */

export const ItemCategoryCreateDto = z.object({
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
})

export type ItemCategoryCreateDto = z.infer<typeof ItemCategoryCreateDto>

export const ItemCategoryUpdateDto = z.object({
  id: zPrimitive.idNum,
  ...ItemCategoryCreateDto.shape,
})

export type ItemCategoryUpdateDto = z.infer<typeof ItemCategoryUpdateDto>

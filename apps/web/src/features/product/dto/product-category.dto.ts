import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/zod'

/* --------------------------------- ENTITY --------------------------------- */

export const ProductCategoryDto = z.object({
  id: zPrimitive.id,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  ...zSchema.meta.shape,
})

export type ProductCategoryDto = z.infer<typeof ProductCategoryDto>

/* --------------------------------- FILTER --------------------------------- */

export const ProductCategoryFilterDto = z.object({
  search: zHttp.search,
})

export type ProductCategoryFilterDto = z.infer<typeof ProductCategoryFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const ProductCategoryMutationDto = z.object({
  ...ProductCategoryDto.pick({
    name: true,
    description: true,
  }).shape,
})

export type ProductCategoryMutationDto = z.infer<
  typeof ProductCategoryMutationDto
>

import z from 'zod'

import { zStrNullable, zStr, zId, zQuerySearch, zMetadataDto } from '@/lib/zod'

/* --------------------------------- ENTITY --------------------------------- */

export const ProductCategoryDto = z.object({
  id: zId,
  name: zStr,
  description: zStrNullable,
  ...zMetadataDto.shape,
})

export type ProductCategoryDto = z.infer<typeof ProductCategoryDto>

/* --------------------------------- FILTER --------------------------------- */

export const ProductCategoryFilterDto = z.object({ search: zQuerySearch })

export type ProductCategoryFilterDto = z.infer<typeof ProductCategoryFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const ProductCategoryMutationDto = z.object({
  ...ProductCategoryDto.pick({ name: true, description: true }).shape,
})

export type ProductCategoryMutationDto = z.infer<typeof ProductCategoryMutationDto>

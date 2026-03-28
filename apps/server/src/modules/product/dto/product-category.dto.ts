import z from 'zod'

import { zStrNullable, zStr, zId, zQuerySearch, zMetadataDto } from '@/core/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const productCategorySchema = z
  .object({
    id: zId,
    name: zStr,
    description: zStrNullable,
    parentId: zId.nullable(),
  })
  .merge(zMetadataDto)

export type ProductCategoryDto = z.infer<typeof productCategorySchema>

/* --------------------------------- FILTER --------------------------------- */

export const productCategoryFilterSchema = z.object({
  search: zQuerySearch,
  parentId: zId.optional(),
})

export type ProductCategoryFilterDto = z.infer<typeof productCategoryFilterSchema>

/* -------------------------------- MUTATION -------------------------------- */

export const productCategoryMutationSchema = productCategorySchema.pick({
  name: true,
  description: true,
  parentId: true,
})

export type ProductCategoryMutationDto = z.infer<typeof productCategoryMutationSchema>

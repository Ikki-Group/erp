import z from 'zod'

import { zStrNullable, zStr, zId, zQuerySearch, zMetadataDto, zRecordIdDto } from '@/core/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const productCategorySchema = z.object({
  ...zRecordIdDto.shape,
  name: zStr,
  description: zStrNullable,
  parentId: zId.nullable(),
  ...zMetadataDto.shape,
})

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

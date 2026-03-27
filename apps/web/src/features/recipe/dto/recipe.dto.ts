import z from 'zod'

import { zStrNullable, zStr, zNum, zBool, zId, zQuerySearch, zQueryBoolean, zQueryId, zMetadataDto } from '@/lib/zod'

/* --------------------------------- NESTED --------------------------------- */

export const RecipeItemDto = z.object({
  id: zId,
  recipeId: zId,
  materialId: zId,
  qty: zStr,
  scrapPercentage: zStr,
  uomId: zId,
  notes: zStrNullable,
  sortOrder: zNum,

  // optional joins
  material: z.object({ name: z.string(), sku: z.string() }).optional(),
  uom: z.object({ code: z.string() }).optional(),

  ...zMetadataDto.shape,
})

export type RecipeItemDto = z.infer<typeof RecipeItemDto>

/* --------------------------------- ENTITY --------------------------------- */

export const RecipeDto = z.object({
  id: zId,
  materialId: zId.nullable(),
  productId: zId.nullable(),
  productVariantId: zId.nullable(),
  targetQty: zStr,
  isActive: zBool,
  instructions: zStrNullable,

  // items can be populated
  items: RecipeItemDto.array().optional(),

  ...zMetadataDto.shape,
})

export type RecipeDto = z.infer<typeof RecipeDto>

/* --------------------------------- FILTER --------------------------------- */

export const RecipeFilterDto = z.object({
  search: zQuerySearch,
  materialId: zQueryId.optional(),
  productId: zQueryId.optional(),
  productVariantId: zQueryId.optional(),
  isActive: zQueryBoolean.optional(),
})

export type RecipeFilterDto = z.infer<typeof RecipeFilterDto>

/* --------------------------------- OUTPUT --------------------------------- */

export const RecipeOutputDto = z.object({ ...RecipeDto.shape })

export type RecipeOutputDto = z.infer<typeof RecipeOutputDto>

/* -------------------------------- MUTATION -------------------------------- */

export const RecipeItemMutationDto = z.object({
  materialId: zId,
  qty: zStr,
  scrapPercentage: zStr.optional().default('0'),
  uomId: zId,
  notes: zStr.optional(),
  sortOrder: zNum.optional().default(0),
})

export type RecipeItemMutationDto = z.infer<typeof RecipeItemMutationDto>

export const RecipeMutationDto = z
  .object({
    materialId: zId.optional().nullable(),
    productId: zId.optional().nullable(),
    productVariantId: zId.optional().nullable(),
    targetQty: zStr.optional().default('1'),
    isActive: zBool.optional().default(true),
    instructions: zStr.optional().nullable(),
    items: RecipeItemMutationDto.array().default([]),
  })
  .refine(
    (data) => {
      // Ensure exactly one target is provided
      const targets = [data.materialId, data.productId, data.productVariantId].filter((t) => t != null)
      return targets.length === 1
    },
    {
      message: 'Recipe must have exactly one target (materialId, productId, or productVariantId)',
      path: ['materialId'],
    },
  )

export type RecipeMutationDto = z.infer<typeof RecipeMutationDto>

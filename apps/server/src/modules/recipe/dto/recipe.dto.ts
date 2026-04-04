import z from 'zod'

import {
  zStrNullable,
  zStr,
  zBool,
  zId,
  zDecimal,
  zSortOrder,
  zNum,
  zQuerySearch,
  zQueryBoolean,
  zQueryId,
  zMetadataDto,
  zRecordIdDto,
} from '@/core/validation'

// ... (rest should be the same, I'll use multi_replace for accuracy or just carefully replace the whole file if it's small, but actually 97 lines is fine for replace_file_content if I'm precise)

/* --------------------------------- NESTED --------------------------------- */

export const RecipeItemDto = z.object({
  ...zRecordIdDto.shape,
  recipeId: zId,
  materialId: zId,
  qty: zDecimal,
  scrapPercentage: zDecimal,
  uomId: zId,
  notes: zStrNullable,
  sortOrder: zSortOrder,

  // optional joins
  material: z.object({ name: z.string(), sku: z.string() }).optional(),
  uom: z.object({ code: z.string() }).optional(),
  ...zMetadataDto.shape,
})

export type RecipeItemDto = z.infer<typeof RecipeItemDto>

/* --------------------------------- ENTITY --------------------------------- */

export const RecipeDto = z.object({
  ...zRecordIdDto.shape,
  materialId: zId.nullable(),
  productId: zId.nullable(),
  productVariantId: zId.nullable(),
  targetQty: zDecimal,
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
  isActive: zQueryBoolean,
})

export type RecipeFilterDto = z.infer<typeof RecipeFilterDto>

/* --------------------------------- RESULT --------------------------------- */

export const RecipeSelectDto = RecipeDto

export type RecipeSelectDto = z.infer<typeof RecipeSelectDto>

/* -------------------------------- MUTATION -------------------------------- */

export const RecipeItemMutationDto = z.object({
  materialId: zId,
  qty: zDecimal,
  scrapPercentage: zDecimal.optional().default('0'),
  uomId: zId,
  notes: zStr.optional(),
  sortOrder: zSortOrder.optional().default(0),
})

export type RecipeItemMutationDto = z.infer<typeof RecipeItemMutationDto>

export const RecipeMutationDto = z
  .object({
    materialId: zId.optional().nullable(),
    productId: zId.optional().nullable(),
    productVariantId: zId.optional().nullable(),
    targetQty: zDecimal.optional().default('1'),
    isActive: zBool.optional().default(true),
    instructions: zStr.optional().nullable(),
    items: RecipeItemMutationDto.array(),
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

/* ---------------------------------- COST ---------------------------------- */

export const RecipeItemCostDto = RecipeItemDto.extend({ unitCost: zNum, extendedCost: zNum })

export type RecipeItemCostDto = z.infer<typeof RecipeItemCostDto>

export const RecipeCostDto = z.object({
  recipeId: zId,
  targetQty: zNum,
  totalCost: zNum,
  unitCost: zNum,
  items: RecipeItemCostDto.array(),
})

export type RecipeCostDto = z.infer<typeof RecipeCostDto>

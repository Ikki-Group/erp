import z from 'zod'

import { zPrimitive, zSchema } from '@/lib/validation'

/* --------------------------------- NESTED --------------------------------- */

export const RecipeItemDto = z.object({
  id: zPrimitive.id,
  recipeId: zPrimitive.id,
  materialId: zPrimitive.id,
  qty: zPrimitive.str,
  uomId: zPrimitive.id,
  ...zSchema.metadata.shape,
})

export type RecipeItemDto = z.infer<typeof RecipeItemDto>

export const RecipeItemDetailDto = RecipeItemDto.extend({
  materialName: zPrimitive.str,
  materialSku: zPrimitive.str,
  materialBaseUom: zPrimitive.str,
})

export type RecipeItemDetailDto = z.infer<typeof RecipeItemDetailDto>

/* --------------------------------- ENTITY --------------------------------- */

export const RecipeDto = z.object({
  id: zPrimitive.id,
  materialId: zPrimitive.id.nullable(),
  productVariantId: zPrimitive.id.nullable(),
  targetQty: zPrimitive.str,
  instructions: zPrimitive.strNullable,
  ...zSchema.metadata.shape,
})

export type RecipeDto = z.infer<typeof RecipeDto>

export const RecipeDetailDto = RecipeDto.extend({
  items: RecipeItemDetailDto.array(),
})

export type RecipeDetailDto = z.infer<typeof RecipeDetailDto>

/* -------------------------------- MUTATION -------------------------------- */

export const RecipeItemMutationDto = z.object({
  materialId: zPrimitive.id,
  qty: zPrimitive.str,
  uomId: zPrimitive.id,
})

export type RecipeItemMutationDto = z.infer<typeof RecipeItemMutationDto>

export const RecipeUpsertDto = z
  .object({
    materialId: zPrimitive.id.nullable().optional(),
    productVariantId: zPrimitive.id.nullable().optional(),
    targetQty: zPrimitive.str.default('1'),
    instructions: zPrimitive.strNullable.optional(),
    items: RecipeItemMutationDto.array(),
  })
  .refine(
    (data) =>
      (data.materialId != null || data.productVariantId != null) &&
      !(data.materialId != null && data.productVariantId != null),
    {
      message: 'Either materialId or productVariantId must be provided, but not both',
    }
  )

export type RecipeUpsertDto = z.infer<typeof RecipeUpsertDto>

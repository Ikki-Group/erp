import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/zod'

/* --------------------------------- NESTED --------------------------------- */

export const RecipeItemDto = z.object({
  id: zPrimitive.id,
  recipeId: zPrimitive.id,
  materialId: zPrimitive.id,
  qty: zPrimitive.str,
  scrapPercentage: zPrimitive.str,
  uomId: zPrimitive.id,
  notes: zPrimitive.strNullable,
  sortOrder: zPrimitive.num,

  // optional joins
  material: z.object({ name: z.string(), sku: z.string() }).optional(),
  uom: z.object({ code: z.string() }).optional(),

  ...zSchema.meta.shape,
})

export type RecipeItemDto = z.infer<typeof RecipeItemDto>

/* --------------------------------- ENTITY --------------------------------- */

export const RecipeDto = z.object({
  id: zPrimitive.id,
  materialId: zPrimitive.id.nullable(),
  productId: zPrimitive.id.nullable(),
  productVariantId: zPrimitive.id.nullable(),
  targetQty: zPrimitive.str,
  isActive: zPrimitive.bool,
  instructions: zPrimitive.strNullable,

  // items can be populated
  items: RecipeItemDto.array().optional(),

  ...zSchema.meta.shape,
})

export type RecipeDto = z.infer<typeof RecipeDto>

/* --------------------------------- FILTER --------------------------------- */

export const RecipeFilterDto = z.object({
  search: zHttp.search,
  materialId: zHttp.id.optional(),
  productId: zHttp.id.optional(),
  productVariantId: zHttp.id.optional(),
  isActive: zHttp.boolean.optional(),
})

export type RecipeFilterDto = z.infer<typeof RecipeFilterDto>

/* --------------------------------- RESULT --------------------------------- */

export const RecipeSelectDto = z.object({
  ...RecipeDto.shape,
})

export type RecipeSelectDto = z.infer<typeof RecipeSelectDto>

/* -------------------------------- MUTATION -------------------------------- */

export const RecipeItemMutationDto = z.object({
  materialId: zPrimitive.id,
  qty: zPrimitive.str,
  scrapPercentage: zPrimitive.str.optional().default('0'),
  uomId: zPrimitive.id,
  notes: zPrimitive.str.optional(),
  sortOrder: zPrimitive.num.optional().default(0),
})

export type RecipeItemMutationDto = z.infer<typeof RecipeItemMutationDto>

export const RecipeMutationDto = z.object({
  materialId: zPrimitive.id.optional().nullable(),
  productId: zPrimitive.id.optional().nullable(),
  productVariantId: zPrimitive.id.optional().nullable(),
  targetQty: zPrimitive.str,
  isActive: zPrimitive.bool,
  instructions: zPrimitive.str.optional().nullable(),
  items: RecipeItemMutationDto.array(),
})

export type RecipeMutationDto = z.infer<typeof RecipeMutationDto>

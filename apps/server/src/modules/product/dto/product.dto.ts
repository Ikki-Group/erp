import z from 'zod'

import { zStrNullable, zStr, zBool, zId, zDecimal, zQuerySearch, zQueryBoolean, zQueryId, zMetadataDto } from '@/core/validation'

import { productCategorySchema } from './product-category.dto'

/* ---------------------------------- ENUM ---------------------------------- */

export const productStatusSchema = z.enum(['active', 'inactive', 'archived'])
export type ProductStatus = z.infer<typeof productStatusSchema>

/* --------------------------------- NESTED --------------------------------- */

export const variantPriceSchema = z
  .object({
    id: zId,
    variantId: zId,
    salesTypeId: zId,
    price: zDecimal,
  })
  .merge(zMetadataDto)

export type VariantPriceDto = z.infer<typeof variantPriceSchema>

export const productPriceSchema = z
  .object({
    id: zId,
    productId: zId,
    salesTypeId: zId,
    price: zDecimal,
  })
  .merge(zMetadataDto)

export type ProductPriceDto = z.infer<typeof productPriceSchema>

export const productVariantSchema = z
  .object({
    id: zId,
    productId: zId,
    name: zStr,
    sku: zStrNullable,
    isDefault: zBool,
    basePrice: zDecimal,
    prices: variantPriceSchema.array(),
  })
  .merge(zMetadataDto)

export type ProductVariantDto = z.infer<typeof productVariantSchema>

export const productExternalMappingSchema = z
  .object({
    id: zId,
    productId: zId,
    variantId: zId.nullable(),
    provider: zStr,
    externalId: zStr,
    lastSyncedAt: z.date().nullable(),
  })
  .merge(zMetadataDto)

export type ProductExternalMappingDto = z.infer<typeof productExternalMappingSchema>

/* --------------------------------- ENTITY --------------------------------- */

export const productSchema = z
  .object({
    id: zId,
    name: zStr,
    description: zStrNullable,
    sku: zStr,
    basePrice: zDecimal,
    locationId: zId,
    categoryId: zId.nullable(),
    status: productStatusSchema,
    hasVariants: zBool,
    hasSalesTypePricing: zBool,
    variants: productVariantSchema.array(),
    prices: productPriceSchema.array(),
    externalMappings: productExternalMappingSchema.array(),
  })
  .merge(zMetadataDto)

export type ProductDto = z.infer<typeof productSchema>

/* --------------------------------- FILTER --------------------------------- */

export const productFilterSchema = z.object({
  search: zQuerySearch,
  status: productStatusSchema.optional(),
  categoryId: zQueryId.optional(),
  locationId: zQueryId.optional(),
  isExternal: zQueryBoolean,
  provider: zStr.optional(),
})

export type ProductFilterDto = z.infer<typeof productFilterSchema>

/* --------------------------------- RESULT --------------------------------- */

export const productSelectSchema = productSchema.extend({
  category: productCategorySchema.nullable(),
})

export type ProductSelectDto = z.infer<typeof productSelectSchema>

/* -------------------------------- MUTATION -------------------------------- */

export const variantPriceMutationSchema = z.object({
  salesTypeId: zId,
  price: zDecimal,
})

export type VariantPriceMutationDto = z.infer<typeof variantPriceMutationSchema>

export const productPriceMutationSchema = z.object({
  salesTypeId: zId,
  price: zDecimal,
})

export type ProductPriceMutationDto = z.infer<typeof productPriceMutationSchema>

export const productVariantMutationSchema = z.object({
  name: zStr,
  sku: zStr.optional(),
  isDefault: zBool.optional().default(false),
  basePrice: zDecimal.optional().default('0'),
  prices: variantPriceMutationSchema.array(),
})

export type ProductVariantMutationDto = z.infer<typeof productVariantMutationSchema>

export const productMutationSchema = productSchema
  .pick({
    name: true,
    description: true,
    sku: true,
    basePrice: true,
    locationId: true,
    categoryId: true,
    status: true,
    hasVariants: true,
    hasSalesTypePricing: true,
  })
  .extend({
    variants: productVariantMutationSchema.array().optional(),
    prices: productPriceMutationSchema.array().optional(),
  })

export type ProductMutationDto = z.infer<typeof productMutationSchema>

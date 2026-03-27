import z from 'zod'

import { zStrNullable, zStr, zBool, zId, zQuerySearch, zQueryBoolean, zQueryId, zMetadataDto } from '@/lib/zod'

import { ProductCategoryDto } from './product-category.dto'

/* ---------------------------------- ENUM ---------------------------------- */

export const ProductStatus = z.enum(['active', 'inactive', 'archived'])
export type ProductStatus = z.infer<typeof ProductStatus>

/* --------------------------------- NESTED --------------------------------- */

export const VariantPriceDto = z.object({
  id: zId,
  variantId: zId,
  salesTypeId: zId,
  price: zStr,
  ...zMetadataDto.shape,
})

export type VariantPriceDto = z.infer<typeof VariantPriceDto>

export const ProductPriceDto = z.object({
  id: zId,
  productId: zId,
  salesTypeId: zId,
  price: zStr,
  ...zMetadataDto.shape,
})

export type ProductPriceDto = z.infer<typeof ProductPriceDto>

export const ProductVariantDto = z.object({
  id: zId,
  productId: zId,
  name: zStr,
  sku: zStrNullable,
  isDefault: zBool,
  basePrice: zStr,
  prices: VariantPriceDto.array(),
  ...zMetadataDto.shape,
})

export type ProductVariantDto = z.infer<typeof ProductVariantDto>

export const ProductExternalMappingDto = z.object({
  id: zId,
  productId: zId,
  variantId: zId.nullable(),
  provider: zStr,
  externalId: zStr,
  lastSyncedAt: z.date().nullable(),
  ...zMetadataDto.shape,
})

export type ProductExternalMappingDto = z.infer<typeof ProductExternalMappingDto>

/* --------------------------------- ENTITY --------------------------------- */

export const ProductDto = z.object({
  id: zId,
  name: zStr,
  description: zStrNullable,
  sku: zStr,
  basePrice: zStr,
  locationId: zId,
  categoryId: zId.nullable(),
  status: ProductStatus,
  hasVariants: zBool,
  hasSalesTypePricing: zBool,
  variants: ProductVariantDto.array(),
  prices: ProductPriceDto.array(),
  externalMappings: ProductExternalMappingDto.array(),
  ...zMetadataDto.shape,
})

export type ProductDto = z.infer<typeof ProductDto>

/* --------------------------------- FILTER --------------------------------- */

export const ProductFilterDto = z.object({
  search: zQuerySearch,
  status: ProductStatus.optional(),
  categoryId: zQueryId.optional(),
  locationId: zQueryId.optional(),
  isExternal: zQueryBoolean,
  provider: zStr.optional(),
})

export type ProductFilterDto = z.infer<typeof ProductFilterDto>

/* --------------------------------- OUTPUT --------------------------------- */

export const ProductOutputDto = z.object({ ...ProductDto.shape, category: ProductCategoryDto.nullable() })

export type ProductOutputDto = z.infer<typeof ProductOutputDto>

/* -------------------------------- MUTATION -------------------------------- */

export const VariantPriceMutationDto = z.object({ salesTypeId: zId, price: zStr })

export type VariantPriceMutationDto = z.infer<typeof VariantPriceMutationDto>

export const ProductPriceMutationDto = z.object({ salesTypeId: zId, price: zStr })

export type ProductPriceMutationDto = z.infer<typeof ProductPriceMutationDto>

export const ProductVariantMutationDto = z.object({
  name: zStr,
  sku: zStr.optional(),
  isDefault: zBool.optional().default(false),
  basePrice: zStr.optional().default('0'),
  prices: VariantPriceMutationDto.array().default([]),
})

export type ProductVariantMutationDto = z.infer<typeof ProductVariantMutationDto>

export const ProductMutationDto = z.object({
  ...ProductDto.pick({
    name: true,
    description: true,
    sku: true,
    basePrice: true,
    locationId: true,
    categoryId: true,
    status: true,
    hasVariants: true,
    hasSalesTypePricing: true,
  }).shape,
  variants: ProductVariantMutationDto.array().default([]),
  prices: ProductPriceMutationDto.array().default([]),
})

export type ProductMutationDto = z.infer<typeof ProductMutationDto>

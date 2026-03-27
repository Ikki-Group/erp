import z from 'zod'

import { zStrNullable, zStr, zBool, zId, zDecimal, zQuerySearch, zQueryBoolean, zQueryId, zMetadataSchema } from '@/core/validation'

import { ProductCategoryDto } from './product-category.dto'

/* ---------------------------------- ENUM ---------------------------------- */

const ProductStatus = z.enum(['active', 'inactive', 'archived'])
type ProductStatus = z.infer<typeof ProductStatus>

/* --------------------------------- NESTED --------------------------------- */

export const VariantPriceDto = z.object({
  id: zId,
  variantId: zId,
  salesTypeId: zId,
  price: zDecimal,
  ...zMetadataSchema.shape,
})

export type VariantPriceDto = z.infer<typeof VariantPriceDto>

export const ProductPriceDto = z.object({
  id: zId,
  productId: zId,
  salesTypeId: zId,
  price: zDecimal,
  ...zMetadataSchema.shape,
})

export type ProductPriceDto = z.infer<typeof ProductPriceDto>

export const ProductVariantDto = z.object({
  id: zId,
  productId: zId,
  name: zStr,
  sku: zStrNullable,
  isDefault: zBool,
  basePrice: zDecimal,
  prices: VariantPriceDto.array(),
  ...zMetadataSchema.shape,
})

export type ProductVariantDto = z.infer<typeof ProductVariantDto>

export const ProductExternalMappingDto = z.object({
  id: zId,
  productId: zId,
  variantId: zId.nullable(),
  provider: zStr,
  externalId: zStr,
  lastSyncedAt: z.date().nullable(),
  ...zMetadataSchema.shape,
})

export type ProductExternalMappingDto = z.infer<typeof ProductExternalMappingDto>

/* --------------------------------- ENTITY --------------------------------- */

export const ProductDto = z.object({
  id: zId,
  name: zStr,
  description: zStrNullable,
  sku: zStr,
  basePrice: zDecimal,
  locationId: zId,
  categoryId: zId.nullable(),
  status: ProductStatus,
  hasVariants: zBool,
  hasSalesTypePricing: zBool,
  variants: ProductVariantDto.array(),
  prices: ProductPriceDto.array(),
  externalMappings: ProductExternalMappingDto.array(),
  ...zMetadataSchema.shape,
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

/* --------------------------------- RESULT --------------------------------- */

export const ProductSelectDto = z.object({ ...ProductDto.shape, category: ProductCategoryDto.nullable() })

export type ProductSelectDto = z.infer<typeof ProductSelectDto>

/* -------------------------------- MUTATION -------------------------------- */

const VariantPriceMutationDto = z.object({ salesTypeId: zId, price: zDecimal })

type VariantPriceMutationDto = z.infer<typeof VariantPriceMutationDto>

const ProductPriceMutationDto = z.object({ salesTypeId: zId, price: zDecimal })

type ProductPriceMutationDto = z.infer<typeof ProductPriceMutationDto>

const ProductVariantMutationDto = z.object({
  name: zStr,
  sku: zStr.optional(),
  isDefault: zBool.optional().default(false),
  basePrice: zDecimal.optional().default('0'),
  prices: VariantPriceMutationDto.array(),
})

type ProductVariantMutationDto = z.infer<typeof ProductVariantMutationDto>

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
  variants: ProductVariantMutationDto.array().optional(),
  prices: ProductPriceMutationDto.array().optional(),
})

export type ProductMutationDto = z.infer<typeof ProductMutationDto>

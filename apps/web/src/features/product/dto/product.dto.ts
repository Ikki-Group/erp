import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/zod'

import { ProductCategoryDto } from './product-category.dto'

/* ---------------------------------- ENUM ---------------------------------- */

export const ProductStatus = z.enum(['active', 'inactive', 'archived'])
export type ProductStatus = z.infer<typeof ProductStatus>

/* --------------------------------- NESTED --------------------------------- */

export const VariantPriceDto = z.object({
  id: zPrimitive.id,
  variantId: zPrimitive.id,
  salesTypeId: zPrimitive.id,
  price: zPrimitive.str,
  ...zSchema.metadata.shape,
})

export type VariantPriceDto = z.infer<typeof VariantPriceDto>

export const ProductPriceDto = z.object({
  id: zPrimitive.id,
  productId: zPrimitive.id,
  salesTypeId: zPrimitive.id,
  price: zPrimitive.str,
  ...zSchema.metadata.shape,
})

export type ProductPriceDto = z.infer<typeof ProductPriceDto>

export const ProductVariantDto = z.object({
  id: zPrimitive.id,
  productId: zPrimitive.id,
  name: zPrimitive.str,
  sku: zPrimitive.strNullable,
  isDefault: zPrimitive.bool,
  basePrice: zPrimitive.str,
  prices: VariantPriceDto.array(),
  ...zSchema.metadata.shape,
})

export type ProductVariantDto = z.infer<typeof ProductVariantDto>

export const ProductExternalMappingDto = z.object({
  id: zPrimitive.id,
  productId: zPrimitive.id,
  variantId: zPrimitive.id.nullable(),
  provider: zPrimitive.str,
  externalId: zPrimitive.str,
  lastSyncedAt: z.date().nullable(),
  ...zSchema.metadata.shape,
})

export type ProductExternalMappingDto = z.infer<typeof ProductExternalMappingDto>

/* --------------------------------- ENTITY --------------------------------- */

export const ProductDto = z.object({
  id: zPrimitive.id,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  sku: zPrimitive.str,
  basePrice: zPrimitive.str,
  locationId: zPrimitive.id,
  categoryId: zPrimitive.id.nullable(),
  status: ProductStatus,
  hasVariants: zPrimitive.bool,
  hasSalesTypePricing: zPrimitive.bool,
  variants: ProductVariantDto.array(),
  prices: ProductPriceDto.array(),
  externalMappings: ProductExternalMappingDto.array(),
  ...zSchema.metadata.shape,
})

export type ProductDto = z.infer<typeof ProductDto>

/* --------------------------------- FILTER --------------------------------- */

export const ProductFilterDto = z.object({
  search: zHttp.query.search,
  status: ProductStatus.optional(),
  categoryId: zHttp.query.id.optional(),
  locationId: zHttp.query.id.optional(),
  isExternal: zHttp.query.boolean,
  provider: zPrimitive.str.optional(),
})

export type ProductFilterDto = z.infer<typeof ProductFilterDto>

/* --------------------------------- OUTPUT --------------------------------- */

export const ProductOutputDto = z.object({ ...ProductDto.shape, category: ProductCategoryDto.nullable() })

export type ProductOutputDto = z.infer<typeof ProductOutputDto>

/* -------------------------------- MUTATION -------------------------------- */

export const VariantPriceMutationDto = z.object({ salesTypeId: zPrimitive.id, price: zPrimitive.str })

export type VariantPriceMutationDto = z.infer<typeof VariantPriceMutationDto>

export const ProductPriceMutationDto = z.object({ salesTypeId: zPrimitive.id, price: zPrimitive.str })

export type ProductPriceMutationDto = z.infer<typeof ProductPriceMutationDto>

export const ProductVariantMutationDto = z.object({
  name: zPrimitive.str,
  sku: zPrimitive.str.optional(),
  isDefault: zPrimitive.bool.optional().default(false),
  basePrice: zPrimitive.str.optional().default('0'),
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

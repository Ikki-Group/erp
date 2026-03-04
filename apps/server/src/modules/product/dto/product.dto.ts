import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

import { ProductCategoryDto } from './product-category.dto'

/* --------------------------------- ENUMS ---------------------------------- */

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

export const ProductVariantDto = z.object({
  id: zPrimitive.id,
  productId: zPrimitive.id,
  name: zPrimitive.str,
  isDefault: zPrimitive.bool,
  basePrice: zPrimitive.str,
  prices: VariantPriceDto.array(),
  ...zSchema.metadata.shape,
})

export type ProductVariantDto = z.infer<typeof ProductVariantDto>

/* --------------------------------- ENTITY --------------------------------- */

export const ProductDto = z.object({
  id: zPrimitive.id,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  sku: zPrimitive.str,
  locationId: zPrimitive.id,
  categoryId: zPrimitive.id.nullable(),
  status: ProductStatus,
  variants: ProductVariantDto.array(),
  ...zSchema.metadata.shape,
})

export type ProductDto = z.infer<typeof ProductDto>

/* --------------------------------- FILTER --------------------------------- */

export const ProductFilterDto = z.object({
  search: zHttp.query.search,
  status: ProductStatus.optional(),
  categoryId: zHttp.query.id.optional(),
  locationId: zHttp.query.id.optional(),
})

export type ProductFilterDto = z.infer<typeof ProductFilterDto>

/* --------------------------------- RESULT --------------------------------- */

export const ProductSelectDto = z.object({
  ...ProductDto.shape,
  category: ProductCategoryDto.nullable(),
})

export type ProductSelectDto = z.infer<typeof ProductSelectDto>

/* -------------------------------- MUTATION -------------------------------- */

export const VariantPriceMutationDto = z.object({
  salesTypeId: zPrimitive.id,
  price: zPrimitive.str,
})

export type VariantPriceMutationDto = z.infer<typeof VariantPriceMutationDto>

export const ProductVariantMutationDto = z.object({
  name: zPrimitive.str,
  isDefault: zPrimitive.bool.optional().default(false),
  basePrice: zPrimitive.str,
  prices: VariantPriceMutationDto.array(),
})

export type ProductVariantMutationDto = z.infer<typeof ProductVariantMutationDto>

export const ProductMutationDto = z.object({
  ...ProductDto.pick({
    name: true,
    description: true,
    sku: true,
    locationId: true,
    categoryId: true,
    status: true,
  }).shape,
  variants: ProductVariantMutationDto.array().optional(),
})

export type ProductMutationDto = z.infer<typeof ProductMutationDto>

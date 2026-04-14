import {
	zBool,
	zDecimal,
	zId,
	zMetadataDto,
	zQueryBoolean,
	zQueryId,
	zQuerySearch,
	zRecordIdDto,
	zStr,
	zStrNullable,
} from '@/lib/zod'

import { ProductCategoryDto } from './product-category.dto'

import z from 'zod'

/* ---------------------------------- ENUM ---------------------------------- */

export const ProductStatusDto = z.enum(['active', 'inactive', 'archived'])
export type ProductStatusDto = z.infer<typeof ProductStatusDto>

/* --------------------------------- NESTED --------------------------------- */

export const VariantPriceDto = z.object({
	...zRecordIdDto.shape,
	variantId: zId,
	salesTypeId: zId,
	price: zDecimal,
	...zMetadataDto.shape,
})

export type VariantPriceDto = z.infer<typeof VariantPriceDto>

export const ProductPriceDto = z.object({
	...zRecordIdDto.shape,
	productId: zId,
	salesTypeId: zId,
	price: zDecimal,
	...zMetadataDto.shape,
})

export type ProductPriceDto = z.infer<typeof ProductPriceDto>

export const ProductVariantDto = z.object({
	...zRecordIdDto.shape,
	productId: zId,
	name: zStr,
	sku: zStrNullable,
	isDefault: zBool,
	basePrice: zDecimal,
	prices: VariantPriceDto.array(),
	...zMetadataDto.shape,
})

export type ProductVariantDto = z.infer<typeof ProductVariantDto>

export const ProductExternalMappingDto = z.object({
	...zRecordIdDto.shape,
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
	...zRecordIdDto.shape,
	name: zStr,
	description: zStrNullable,
	sku: zStr,
	basePrice: zDecimal,
	locationId: zId,
	categoryId: zId.nullable(),
	status: ProductStatusDto,
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
	q: zQuerySearch,
	status: ProductStatusDto.optional(),
	categoryId: zQueryId.optional(),
	locationId: zQueryId.optional(),
	isExternal: zQueryBoolean,
	provider: zStr.optional(),
})

export type ProductFilterDto = z.infer<typeof ProductFilterDto>

/* --------------------------------- RESULT --------------------------------- */

export const ProductSelectDto = ProductDto.extend({ category: ProductCategoryDto.nullable() })

export type ProductSelectDto = z.infer<typeof ProductSelectDto>

/* -------------------------------- MUTATION -------------------------------- */

export const VariantPriceMutationDto = z.object({ salesTypeId: zId, price: zDecimal })

export type VariantPriceMutationDto = z.infer<typeof VariantPriceMutationDto>

export const ProductPriceMutationDto = z.object({ salesTypeId: zId, price: zDecimal })

export type ProductPriceMutationDto = z.infer<typeof ProductPriceMutationDto>

export const ProductVariantMutationDto = z.object({
	name: zStr,
	sku: zStr.optional(),
	isDefault: zBool.optional().default(false),
	basePrice: zDecimal.optional().default('0'),
	prices: VariantPriceMutationDto.array(),
})

export type ProductVariantMutationDto = z.infer<typeof ProductVariantMutationDto>

export const ProductMutationDto = ProductDto.pick({
	name: true,
	description: true,
	sku: true,
	basePrice: true,
	locationId: true,
	categoryId: true,
	status: true,
	hasVariants: true,
	hasSalesTypePricing: true,
}).extend({
	variants: ProductVariantMutationDto.array().optional(),
	prices: ProductPriceMutationDto.array().optional(),
})

export type ProductMutationDto = z.infer<typeof ProductMutationDto>

import z from 'zod'

import { zp, zc, zq } from '@/lib/validation'

import { ProductCategoryDto } from './product-category.dto'

/* ---------------------------------- ENUM ---------------------------------- */

export const ProductStatusDto = z.enum(['active', 'inactive', 'archived'])
export type ProductStatusDto = z.infer<typeof ProductStatusDto>

/* --------------------------------- NESTED --------------------------------- */

export const VariantPriceDto = z.object({
	...zc.RecordId.shape,
	variantId: zp.id,
	salesTypeId: zp.id,
	price: zp.decimal,
	...zc.AuditFull.shape,
})

export type VariantPriceDto = z.infer<typeof VariantPriceDto>

export const ProductPriceDto = z.object({
	...zc.RecordId.shape,
	productId: zp.id,
	salesTypeId: zp.id,
	price: zp.decimal,
	...zc.AuditFull.shape,
})

export type ProductPriceDto = z.infer<typeof ProductPriceDto>

export const ProductVariantDto = z.object({
	...zc.RecordId.shape,
	productId: zp.id,
	name: zp.str,
	sku: zp.strNullable,
	isDefault: zp.bool,
	basePrice: zp.decimal,
	prices: VariantPriceDto.array(),
	...zc.AuditFull.shape,
})

export type ProductVariantDto = z.infer<typeof ProductVariantDto>

export const ProductExternalMappingDto = z.object({
	...zc.RecordId.shape,
	productId: zp.id,
	variantId: zp.id.nullable(),
	provider: zp.str,
	externalId: zp.str,
	lastSyncedAt: z.date().nullable(),
	...zc.AuditFull.shape,
})

export type ProductExternalMappingDto = z.infer<typeof ProductExternalMappingDto>

/* --------------------------------- ENTITY --------------------------------- */

export const ProductDto = z.object({
	...zc.RecordId.shape,
	name: zp.str,
	description: zp.strNullable,
	sku: zp.str,
	basePrice: zp.decimal,
	locationId: zp.id,
	categoryId: zp.id.nullable(),
	status: ProductStatusDto,
	hasVariants: zp.bool,
	hasSalesTypePricing: zp.bool,
	variants: ProductVariantDto.array(),
	prices: ProductPriceDto.array(),
	externalMappings: ProductExternalMappingDto.array(),
	...zc.AuditFull.shape,
})

export type ProductDto = z.infer<typeof ProductDto>

/* --------------------------------- FILTER --------------------------------- */

export const ProductFilterDto = z.object({
	q: zq.search,
	status: ProductStatusDto.optional(),
	categoryId: zq.id.optional(),
	locationId: zq.id.optional(),
	isExternal: zq.boolean,
	provider: zp.str.optional(),
})

export type ProductFilterDto = z.infer<typeof ProductFilterDto>

/* --------------------------------- RESULT --------------------------------- */

export const ProductSelectDto = ProductDto.extend({ category: ProductCategoryDto.nullable() })

export type ProductSelectDto = z.infer<typeof ProductSelectDto>

/* -------------------------------- MUTATION -------------------------------- */

export const VariantPriceMutationDto = z.object({ salesTypeId: zp.id, price: zp.decimal })

export type VariantPriceMutationDto = z.infer<typeof VariantPriceMutationDto>

export const ProductPriceMutationDto = z.object({ salesTypeId: zp.id, price: zp.decimal })

export type ProductPriceMutationDto = z.infer<typeof ProductPriceMutationDto>

export const ProductVariantMutationDto = z.object({
	name: zp.str,
	sku: zp.str.optional(),
	isDefault: zp.bool.optional().default(false),
	basePrice: zp.decimal.optional().default('0'),
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
export const ProductUpdateDto = z.object({ ...zc.RecordId.shape, ...ProductMutationDto.shape })

export type ProductUpdateDto = z.infer<typeof ProductUpdateDto>

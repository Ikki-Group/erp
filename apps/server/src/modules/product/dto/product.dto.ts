import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

import { ProductCategoryDto } from './product-category.dto'

/* ---------------------------------- ENUM ---------------------------------- */

export const ProductStatusEnum = z.enum(['active', 'inactive', 'archived'])
export type ProductStatus = z.infer<typeof ProductStatusEnum>

/* --------------------------------- NESTED --------------------------------- */

export const VariantPriceDto = z.object({
	...zc.RecordId.shape,
	variantId: zp.id,
	salesTypeId: zp.id,
	price: zp.decimal,
	...zc.AuditBasic.shape,
})
export type VariantPriceDto = z.infer<typeof VariantPriceDto>

export const ProductPriceDto = z.object({
	...zc.RecordId.shape,
	productId: zp.id,
	salesTypeId: zp.id,
	price: zp.decimal,
	...zc.AuditBasic.shape,
})
export type ProductPriceDto = z.infer<typeof ProductPriceDto>

export const ProductVariantDto = z.object({
	...zc.RecordId.shape,
	productId: zp.id,
	name: zp.str,
	sku: zp.strNullable,
	isDefault: zp.bool,
	basePrice: zp.decimal,
	prices: z.array(VariantPriceDto),
	...zc.AuditBasic.shape,
})
export type ProductVariantDto = z.infer<typeof ProductVariantDto>

export const ProductExternalMappingDto = z.object({
	...zc.RecordId.shape,
	productId: zp.id,
	variantId: zp.id.nullable(),
	provider: zp.str,
	externalId: zp.str,
	lastSyncedAt: zp.date.nullable(),
	...zc.AuditBasic.shape,
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
	status: ProductStatusEnum,
	hasVariants: zp.bool,
	hasSalesTypePricing: zp.bool,
	variants: z.array(ProductVariantDto),
	prices: z.array(ProductPriceDto),
	externalMappings: z.array(ProductExternalMappingDto),
	...zc.AuditBasic.shape,
})
export type ProductDto = z.infer<typeof ProductDto>

/* --------------------------------- FILTER --------------------------------- */

export const ProductFilterDto = z.object({
	...zq.pagination.shape,
	search: zq.search,
	status: ProductStatusEnum.optional(),
	categoryId: zq.id.optional(),
	locationId: zq.id.optional(),
	isExternal: zq.boolean,
	provider: zp.str.optional(),
})
export type ProductFilterDto = z.infer<typeof ProductFilterDto>

/* --------------------------------- RESULT --------------------------------- */

export const ProductSelectDto = ProductDto.extend({
	category: ProductCategoryDto.nullable(),
})
export type ProductSelectDto = z.infer<typeof ProductSelectDto>

/* -------------------------------- MUTATION -------------------------------- */

const VariantPriceMutationDto = z.object({
	salesTypeId: zp.id,
	price: zp.decimal,
})

const ProductVariantMutationDto = z.object({
	name: zc.strTrim.min(1).max(100),
	sku: zc.strTrim.uppercase().optional().nullable(),
	isDefault: zp.bool.default(false),
	basePrice: zp.decimal.default('0'),
	prices: z.array(VariantPriceMutationDto).default([]),
})

const ProductPriceMutationDto = z.object({
	salesTypeId: zp.id,
	price: zp.decimal,
})

export const ProductMutationDto = z.object({
	name: zc.strTrim.min(3).max(100),
	description: zc.strTrimNullable,
	sku: zc.strTrim.uppercase().min(3).max(50),
	basePrice: zp.decimal.default('0'),
	locationId: zp.id,
	categoryId: zp.id.nullable(),
	status: ProductStatusEnum.default('active'),
	hasVariants: zp.bool.default(false),
	hasSalesTypePricing: zp.bool.default(false),
	variants: z.array(ProductVariantMutationDto).optional(),
	prices: z.array(ProductPriceMutationDto).optional(),
})
export type ProductMutationDto = z.infer<typeof ProductMutationDto>

export const ProductCreateDto = ProductMutationDto
export type ProductCreateDto = z.infer<typeof ProductCreateDto>

export const ProductUpdateDto = ProductMutationDto.extend({
	...zc.RecordId.shape,
})
export type ProductUpdateDto = z.infer<typeof ProductUpdateDto>

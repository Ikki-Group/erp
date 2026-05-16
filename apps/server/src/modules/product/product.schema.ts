import { z, zc, zp, zq } from '@ikki/api-contract/validation'

import { ProductCategorySchema } from './category.schema'

/* ---------------------------------- ENUM ---------------------------------- */

export const ProductStatusEnum = z.enum(['active', 'inactive', 'archived'])
export type ProductStatus = z.infer<typeof ProductStatusEnum>

/* --------------------------------- NESTED --------------------------------- */

export const VariantPriceSchema = z.object({
	...zc.RecordId.shape,
	variantId: zp.id,
	salesTypeId: zp.id,
	price: zp.decimal,
	...zc.AuditBasic.shape,
})
export type VariantPriceSchema = z.infer<typeof VariantPriceSchema>

export const ProductPriceSchema = z.object({
	...zc.RecordId.shape,
	productId: zp.id,
	salesTypeId: zp.id,
	price: zp.decimal,
	...zc.AuditBasic.shape,
})
export type ProductPriceSchema = z.infer<typeof ProductPriceSchema>

export const ProductVariantSchema = z.object({
	...zc.RecordId.shape,
	productId: zp.id,
	name: zp.str,
	sku: zp.strNullable,
	isDefault: zp.bool,
	basePrice: zp.decimal,
	prices: z.array(VariantPriceSchema),
	...zc.AuditBasic.shape,
})
export type ProductVariantSchema = z.infer<typeof ProductVariantSchema>

export const ProductExternalMappingSchema = z.object({
	...zc.RecordId.shape,
	productId: zp.id,
	variantId: zp.id.nullable(),
	provider: zp.str,
	externalId: zp.str,
	lastSyncedAt: zp.date.nullable(),
	...zc.AuditBasic.shape,
})
export type ProductExternalMappingSchema = z.infer<typeof ProductExternalMappingSchema>

/* --------------------------------- ENTITY --------------------------------- */

export const ProductSchema = z.object({
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
	variants: z.array(ProductVariantSchema),
	prices: z.array(ProductPriceSchema),
	externalMappings: z.array(ProductExternalMappingSchema),
	...zc.AuditBasic.shape,
})
export type ProductSchema = z.infer<typeof ProductSchema>

/* --------------------------------- FILTER --------------------------------- */

export const ProductFilterSchema = z.object({
	...zq.pagination.shape,
	search: zq.search,
	status: ProductStatusEnum.optional(),
	categoryId: zq.id.optional(),
	locationId: zq.id.optional(),
	isExternal: zq.boolean,
	provider: zp.str.optional(),
})
export type ProductFilterSchema = z.infer<typeof ProductFilterSchema>

/* --------------------------------- RESULT --------------------------------- */

export const ProductSelectSchema = ProductSchema.extend({
	category: ProductCategorySchema.nullable(),
})
export type ProductSelectSchema = z.infer<typeof ProductSelectSchema>

/* -------------------------------- MUTATION -------------------------------- */

const VariantPriceMutationSchema = z.object({
	salesTypeId: zp.id,
	price: zp.decimal,
})

const ProductVariantMutationSchema = z.object({
	name: zc.strTrim.min(1).max(100),
	sku: zc.strTrim.uppercase().optional().nullable(),
	isDefault: zp.bool.default(false),
	basePrice: zp.decimal.default('0'),
	prices: z.array(VariantPriceMutationSchema).default([]),
})

const ProductPriceMutationSchema = z.object({
	salesTypeId: zp.id,
	price: zp.decimal,
})

export const ProductMutationSchema = z.object({
	name: zc.strTrim.min(3).max(100),
	description: zc.strTrimNullable,
	sku: zc.strTrim.uppercase().min(3).max(50),
	basePrice: zp.decimal.default('0'),
	locationId: zp.id,
	categoryId: zp.id.nullable(),
	status: ProductStatusEnum.default('active'),
	hasVariants: zp.bool.default(false),
	hasSalesTypePricing: zp.bool.default(false),
	variants: z.array(ProductVariantMutationSchema).optional(),
	prices: z.array(ProductPriceMutationSchema).optional(),
})
export type ProductMutationSchema = z.infer<typeof ProductMutationSchema>

export const ProductCreateSchema = ProductMutationSchema
export type ProductCreateSchema = z.infer<typeof ProductCreateSchema>

export const ProductUpdateSchema = ProductMutationSchema.extend({
	...zc.RecordId.shape,
})
export type ProductUpdateSchema = z.infer<typeof ProductUpdateSchema>

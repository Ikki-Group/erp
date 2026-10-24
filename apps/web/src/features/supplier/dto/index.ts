import { z } from 'zod'

import { zc, zp, zq } from '@/lib/validation/index.ts'

// ─── Supplier Response ───

export const SupplierDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	contactPerson: zp.str.nullable(),
	phone: zp.str.nullable(),
	email: zp.str.nullable(),
	address: zp.str.nullable(),
	paymentTerms: zp.num.nullable(),
	isActive: zp.bool,
	...zc.AuditBasic.shape,
})
export type SupplierDto = z.infer<typeof SupplierDto>

// ─── Supplier Filter ───

export const SupplierFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	isActive: z.coerce.number().int().min(0).max(1).optional(),
})
export type SupplierFilterDto = z.infer<typeof SupplierFilterDto>

// ─── Supplier Create ───

export const SupplierCreateDto = z.object({
	code: zc.strTrim.max(50),
	name: zc.strTrim.min(2).max(255),
	contactPerson: z.string().trim().max(255).nullable().default(null),
	phone: z.string().trim().max(50).nullable().default(null),
	email: z.string().trim().max(255).nullable().default(null),
	address: z.string().trim().max(500).nullable().default(null),
	paymentTerms: z.number().int().positive().nullable().default(null),
	isActive: z.boolean().default(true),
})
export type SupplierCreateDto = z.infer<typeof SupplierCreateDto>

// ─── Supplier Update ───

export const SupplierUpdateDto = z.object({
	id: zp.id,
	code: zc.strTrim.max(50),
	name: zc.strTrim.min(2).max(255),
	contactPerson: z.string().trim().max(255).nullable().default(null),
	phone: z.string().trim().max(50).nullable().default(null),
	email: z.string().trim().max(255).nullable().default(null),
	address: z.string().trim().max(500).nullable().default(null),
	paymentTerms: z.number().int().positive().nullable().default(null),
	isActive: z.boolean().default(true),
})
export type SupplierUpdateDto = z.infer<typeof SupplierUpdateDto>

// ─── Supplier-Material Pricing Response ───

export const SupplierMaterialDto = z.object({
	id: zp.id,
	supplierId: zp.id,
	materialId: zp.id,
	unitPrice: zp.str,
	uomId: zp.id,
	minOrderQty: zp.str.nullable(),
	...zc.AuditBasic.shape,
})
export type SupplierMaterialDto = z.infer<typeof SupplierMaterialDto>

// ─── Supplier-Material Pricing Filter ───

export const SupplierMaterialFilterDto = z.object({
	...zq.pagination.shape,
	supplierId: z.coerce.number().int().positive().optional(),
	materialId: z.coerce.number().int().positive().optional(),
})
export type SupplierMaterialFilterDto = z.infer<typeof SupplierMaterialFilterDto>

// ─── Supplier-Material Pricing Create ───

export const SupplierMaterialCreateDto = z.object({
	supplierId: zp.id,
	materialId: zp.id,
	unitPrice: zc.strTrim.regex(/^\d+(\.\d+)?$/u, 'Must be a positive decimal'),
	uomId: zp.id,
	minOrderQty: z
		.string()
		.trim()
		.regex(/^\d+(\.\d+)?$/u, 'Must be a positive decimal')
		.nullable()
		.default(null),
})
export type SupplierMaterialCreateDto = z.infer<typeof SupplierMaterialCreateDto>

// ─── Supplier-Material Pricing Update ───

export const SupplierMaterialUpdateDto = z.object({
	id: zp.id,
	unitPrice: zc.strTrim.regex(/^\d+(\.\d+)?$/u, 'Must be a positive decimal'),
	uomId: zp.id,
	minOrderQty: z
		.string()
		.trim()
		.regex(/^\d+(\.\d+)?$/u, 'Must be a positive decimal')
		.nullable()
		.default(null),
})
export type SupplierMaterialUpdateDto = z.infer<typeof SupplierMaterialUpdateDto>

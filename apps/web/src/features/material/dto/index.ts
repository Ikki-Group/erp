import { z } from 'zod'

import { zc, zp, zq } from '@/lib/validation/index.ts'

// ─── Enums ───

export const MaterialTypeEnum = z.enum(['raw', 'semi_finished'])
export type MaterialTypeEnum = z.infer<typeof MaterialTypeEnum>

export const MATERIAL_TYPE_OPTIONS = [
	{ label: 'Raw', value: 'raw' },
	{ label: 'Semi Finished', value: 'semi_finished' },
] as const

// ─── Material Response ───

export const MaterialDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	type: MaterialTypeEnum,
	categoryId: zp.id.nullable(),
	baseUomId: zp.id,
	defaultPurchaseUomId: zp.id.nullable(),
	defaultStockUomId: zp.id.nullable(),
	defaultRecipeUomId: zp.id.nullable(),
	minStock: zp.str.nullable(),
	isActive: zp.bool,
	...zc.AuditBasic.shape,
})
export type MaterialDto = z.infer<typeof MaterialDto>

// ─── Material Filter ───

export const MaterialFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	categoryId: z.coerce.number().int().positive().optional(),
	type: MaterialTypeEnum.optional(),
	locationId: z.coerce.number().int().positive().optional(),
})
export type MaterialFilterDto = z.infer<typeof MaterialFilterDto>

// ─── Material Create ───

export const MaterialCreateDto = z.object({
	code: zc.strTrim.max(50),
	name: zc.strTrim.min(2).max(255),
	type: MaterialTypeEnum,
	categoryId: zp.id.nullable().default(null),
	baseUomId: zp.id,
	defaultPurchaseUomId: zp.id.nullable().default(null),
	defaultStockUomId: zp.id.nullable().default(null),
	defaultRecipeUomId: zp.id.nullable().default(null),
	minStock: z
		.string()
		.trim()
		.regex(/^\d+(\.\d+)?$/u, 'Must be a positive decimal')
		.nullable()
		.default(null),
	isActive: z.boolean().default(true),
})
export type MaterialCreateDto = z.infer<typeof MaterialCreateDto>

// ─── Material Update ───

export const MaterialUpdateDto = z.object({
	id: zp.id,
	code: zc.strTrim.max(50),
	name: zc.strTrim.min(2).max(255),
	type: MaterialTypeEnum,
	categoryId: zp.id.nullable().default(null),
	baseUomId: zp.id,
	defaultPurchaseUomId: zp.id.nullable().default(null),
	defaultStockUomId: zp.id.nullable().default(null),
	defaultRecipeUomId: zp.id.nullable().default(null),
	minStock: z
		.string()
		.trim()
		.regex(/^\d+(\.\d+)?$/u, 'Must be a positive decimal')
		.nullable()
		.default(null),
	isActive: z.boolean().default(true),
})
export type MaterialUpdateDto = z.infer<typeof MaterialUpdateDto>

// ─── Category Response ───

export const MaterialCategoryDto = z.object({
	id: zp.id,
	name: zp.str,
	...zc.AuditBasic.shape,
})
export type MaterialCategoryDto = z.infer<typeof MaterialCategoryDto>

// ─── Category Filter ───

export const MaterialCategoryFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
})
export type MaterialCategoryFilterDto = z.infer<typeof MaterialCategoryFilterDto>

// ─── Category Create ───

export const MaterialCategoryCreateDto = z.object({
	name: zc.strTrim.min(2).max(100),
})
export type MaterialCategoryCreateDto = z.infer<typeof MaterialCategoryCreateDto>

// ─── Category Update ───

export const MaterialCategoryUpdateDto = z.object({
	id: zp.id,
	name: zc.strTrim.min(2).max(100),
})
export type MaterialCategoryUpdateDto = z.infer<typeof MaterialCategoryUpdateDto>

// ─── Assignment Response ───

export const MaterialLocationDto = z.object({
	id: zp.id,
	materialId: zp.id,
	locationId: zp.id,
	...zc.AuditBasic.shape,
})
export type MaterialLocationDto = z.infer<typeof MaterialLocationDto>

// ─── Assignment Input ───

export const MaterialAssignDto = z.object({
	materialId: zp.id,
	locationId: zp.id,
})
export type MaterialAssignDto = z.infer<typeof MaterialAssignDto>

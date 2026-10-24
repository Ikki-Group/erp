import { z } from 'zod'

import { zc, zp, zq } from '@/lib/validation/index.ts'

// ─── Enums ───

export const UomCategoryEnum = z.enum(['weight', 'volume', 'quantity', 'length'])
export type UomCategoryEnum = z.infer<typeof UomCategoryEnum>

export const UOM_CATEGORY_OPTIONS = [
	{ label: 'Weight', value: 'weight' },
	{ label: 'Volume', value: 'volume' },
	{ label: 'Quantity', value: 'quantity' },
	{ label: 'Length', value: 'length' },
] as const

// ─── Response ───

export const UomDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	category: UomCategoryEnum,
	...zc.AuditBasic.shape,
})
export type UomDto = z.infer<typeof UomDto>

// ─── Filter ───

export const UomFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	category: UomCategoryEnum.optional(),
})
export type UomFilterDto = z.infer<typeof UomFilterDto>

// ─── Create ───

export const UomCreateDto = z.object({
	code: zc.strTrim.max(50),
	name: zc.strTrim.min(2).max(100),
	category: UomCategoryEnum,
})
export type UomCreateDto = z.infer<typeof UomCreateDto>

// ─── Update ───

export const UomUpdateDto = z.object({
	id: zp.id,
	code: zc.strTrim.max(50),
	name: zc.strTrim.min(2).max(100),
	category: UomCategoryEnum,
})
export type UomUpdateDto = z.infer<typeof UomUpdateDto>

// ─── Conversion Response ───

export const UomConversionDto = z.object({
	id: zp.id,
	fromUomId: zp.id,
	toUomId: zp.id,
	factor: zp.str,
	...zc.AuditBasic.shape,
})
export type UomConversionDto = z.infer<typeof UomConversionDto>

// ─── Conversion Create ───

export const UomConversionCreateDto = z.object({
	fromUomId: zp.id,
	toUomId: zp.id,
	factor: zc.strTrim.regex(/^\d+(\.\d+)?$/u, 'Must be a positive decimal'),
})
export type UomConversionCreateDto = z.infer<typeof UomConversionCreateDto>

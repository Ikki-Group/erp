import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema/index.ts'

// ─── Enums ───

export const MaterialTypeEnum = z.enum(['raw', 'semi_finished'])
export type MaterialTypeEnum = z.infer<typeof MaterialTypeEnum>

// ─── Response ───

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

// ─── Filter ───

export const MaterialFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	categoryId: z.coerce.number().int().positive().optional(),
	type: MaterialTypeEnum.optional(),
	locationId: z.coerce.number().int().positive().optional(),
})
export type MaterialFilterDto = z.infer<typeof MaterialFilterDto>

// ─── Mutation Base (internal) ───

const MaterialMutationDto = z.object({
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

// ─── Create / Update ───

export const MaterialCreateDto = MaterialMutationDto
export type MaterialCreateDto = z.infer<typeof MaterialCreateDto>

export const MaterialUpdateDto = z.object({
	id: zp.id,
	...MaterialMutationDto.shape,
})
export type MaterialUpdateDto = z.infer<typeof MaterialUpdateDto>

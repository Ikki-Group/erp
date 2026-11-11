import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema/index.ts'

// ─── Enums ───

export const UomCategoryEnum = z.enum(['weight', 'volume', 'quantity', 'length'])
export type UomCategoryEnum = z.infer<typeof UomCategoryEnum>

// ─── UoM Mutation Base (internal) ───

const UomMutationDto = z.object({
	code: zc.strTrim.max(50),
	name: zc.strTrim.min(2).max(100),
	category: UomCategoryEnum,
})

// ─── UoM Response ───

export const UomDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	category: UomCategoryEnum,
	...zc.AuditBasic.shape,
})
export type UomDto = z.infer<typeof UomDto>

// ─── UoM Filter ───

export const UomFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	category: UomCategoryEnum.optional(),
})
export type UomFilterDto = z.infer<typeof UomFilterDto>

// ─── UoM Create / Update ───

export const UomCreateDto = UomMutationDto
export type UomCreateDto = z.infer<typeof UomCreateDto>

export const UomUpdateDto = z.object({
	id: zp.id,
	...UomMutationDto.shape,
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

// ─── Convert Request / Response ───

export const ConvertRequestDto = z.object({
	fromUomId: zp.id,
	toUomId: zp.id,
	quantity: zc.strTrim.regex(/^\d+(\.\d+)?$/u, 'Must be a positive decimal'),
})
export type ConvertRequestDto = z.infer<typeof ConvertRequestDto>

export const ConversionStepDto = z.object({
	fromUomId: zp.id,
	toUomId: zp.id,
	factor: zp.str,
})
export type ConversionStepDto = z.infer<typeof ConversionStepDto>

export const ConvertResponseDto = z.object({
	result: zp.str,
	path: z.array(ConversionStepDto),
})
export type ConvertResponseDto = z.infer<typeof ConvertResponseDto>

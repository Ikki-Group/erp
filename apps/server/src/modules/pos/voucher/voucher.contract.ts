import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema/index.ts'

// ─── Enums ───

export const VoucherTypeEnum = z.enum(['percentage', 'fixed'])
export type VoucherTypeEnum = z.infer<typeof VoucherTypeEnum>

// ─── Mutation Base (internal, not exported) ───

const VoucherMutationDto = z.object({
	code: zc.strTrim.max(50),
	name: zc.strTrim.min(3).max(255),
	type: VoucherTypeEnum,
	value: z.coerce.number().positive(),
	minPurchase: z.coerce.number().nonnegative().nullable().optional(),
	maxDiscount: z.coerce.number().positive().nullable().optional(),
	validFrom: z.coerce.date(),
	validUntil: z.coerce.date(),
	usageLimit: z.coerce.number().int().positive().nullable().optional(),
	isActive: zp.bool.optional().default(true),
})

// ─── Response ───

export const VoucherDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	type: VoucherTypeEnum,
	value: zp.str,
	minPurchase: zp.str.nullable(),
	maxDiscount: zp.str.nullable(),
	validFrom: zp.datetime,
	validUntil: zp.datetime,
	usageLimit: z.number().int().nullable(),
	usageCount: z.number().int(),
	isActive: zp.bool,
	...zc.AuditBasic.shape,
})
export type VoucherDto = z.infer<typeof VoucherDto>

// ─── Filter ───

export const VoucherFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	type: VoucherTypeEnum.optional(),
	isActive: z.coerce.boolean().optional(),
})
export type VoucherFilterDto = z.infer<typeof VoucherFilterDto>

// ─── Create / Update ───

export const VoucherCreateDto = VoucherMutationDto
export type VoucherCreateDto = z.infer<typeof VoucherCreateDto>

export const VoucherUpdateDto = z.object({
	id: zp.id,
	...VoucherMutationDto.shape,
})
export type VoucherUpdateDto = z.infer<typeof VoucherUpdateDto>

// ─── Validate ───

export const VoucherValidateDto = z.object({
	code: zc.strTrim,
	orderTotal: z.coerce.number().nonnegative(),
})
export type VoucherValidateDto = z.infer<typeof VoucherValidateDto>

export const VoucherValidateResponseDto = z.object({
	valid: zp.bool,
	discountAmount: zp.num,
	reason: zp.str.optional(),
})
export type VoucherValidateResponseDto = z.infer<typeof VoucherValidateResponseDto>

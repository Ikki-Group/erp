import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema/index.ts'

// ─── Enums ───

export const PaymentMethodTypeEnum = z.enum(['cash', 'digital'])
export type PaymentMethodTypeEnum = z.infer<typeof PaymentMethodTypeEnum>

// ─── Mutation Base (internal, not exported) ───

const PaymentMethodMutationDto = z.object({
	code: zc.strTrim,
	name: zc.strTrim.min(3).max(100),
	type: PaymentMethodTypeEnum,
	isActive: zp.bool.optional().default(true),
})

// ─── Response ───

export const PaymentMethodDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	type: PaymentMethodTypeEnum,
	isActive: zp.bool,
	...zc.AuditBasic.shape,
})
export type PaymentMethodDto = z.infer<typeof PaymentMethodDto>

// ─── Filter ───

export const PaymentMethodFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	type: PaymentMethodTypeEnum.optional(),
})
export type PaymentMethodFilterDto = z.infer<typeof PaymentMethodFilterDto>

// ─── Create / Update ───

export const PaymentMethodCreateDto = PaymentMethodMutationDto
export type PaymentMethodCreateDto = z.infer<typeof PaymentMethodCreateDto>

export const PaymentMethodUpdateDto = z.object({
	id: zp.id,
	...PaymentMethodMutationDto.shape,
})
export type PaymentMethodUpdateDto = z.infer<typeof PaymentMethodUpdateDto>

// ─── Location Assignment ───

export const PaymentMethodLocationDto = z.object({
	id: zp.id,
	paymentMethodId: zp.id,
	locationId: zp.id,
	isEnabled: zp.bool,
})
export type PaymentMethodLocationDto = z.infer<typeof PaymentMethodLocationDto>

export const PaymentMethodLocationAssignDto = z.object({
	paymentMethodId: zp.id,
	locationId: zp.id,
	isEnabled: zp.bool.optional().default(true),
})
export type PaymentMethodLocationAssignDto = z.infer<typeof PaymentMethodLocationAssignDto>

import { z } from 'zod'

import { zc, zp, zq } from '@/lib/validation/index.ts'

// ─── Enums ───

export const PaymentMethodTypeEnum = z.enum(['cash', 'digital'])
export type PaymentMethodTypeEnum = z.infer<typeof PaymentMethodTypeEnum>

export const PAYMENT_METHOD_TYPE_OPTIONS = [
	{ label: 'Cash', value: 'cash' },
	{ label: 'Digital', value: 'digital' },
] as const

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

// ─── Create ───

export const PaymentMethodCreateDto = z.object({
	code: zc.strTrim,
	name: zc.strTrim.min(3).max(100),
	type: PaymentMethodTypeEnum,
	isActive: zp.bool.optional().default(true),
})
export type PaymentMethodCreateDto = z.infer<typeof PaymentMethodCreateDto>

// ─── Update ───

export const PaymentMethodUpdateDto = z.object({
	id: zp.id,
	code: zc.strTrim,
	name: zc.strTrim.min(3).max(100),
	type: PaymentMethodTypeEnum,
	isActive: zp.bool.optional().default(true),
})
export type PaymentMethodUpdateDto = z.infer<typeof PaymentMethodUpdateDto>

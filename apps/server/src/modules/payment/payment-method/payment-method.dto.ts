import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema'

/** Payment method types. */
export const PaymentMethodTypeDto = z.enum([
	'cash',
	'bank_transfer',
	'credit_card',
	'debit_card',
	'e_wallet',
])
export type PaymentMethodTypeDto = z.infer<typeof PaymentMethodTypeDto>

/** Cash vs cashless flag. */
export const PaymentMethodCategoryDto = z.enum(['cash', 'cashless'])
export type PaymentMethodCategoryDto = z.infer<typeof PaymentMethodCategoryDto>

export const PaymentMethodDto = z.object({
	...zc.RecordId.shape,
	type: PaymentMethodTypeDto,
	category: PaymentMethodCategoryDto,
	name: zp.str,
	isEnabled: zp.bool,
	isDefault: zp.bool,
	isGlobal: zp.bool,
	paymentProviderId: zp.num.nullable(),
	...zc.AuditBasic.shape,
})
export type PaymentMethodDto = z.infer<typeof PaymentMethodDto>

export const PaymentMethodCreateDto = z.object({
	type: PaymentMethodTypeDto,
	category: PaymentMethodCategoryDto,
	name: zc.strTrim.min(2).max(100),
	isEnabled: zp.bool.default(true),
	isDefault: zp.bool.default(false),
	isGlobal: zp.bool.default(false),
	paymentProviderId: zp.num.nullable(),
})
export type PaymentMethodCreateDto = z.infer<typeof PaymentMethodCreateDto>

export const PaymentMethodUpdateDto = z.object({
	...zc.RecordId.shape,
	...PaymentMethodCreateDto.shape,
})
export type PaymentMethodUpdateDto = z.infer<typeof PaymentMethodUpdateDto>

export const PaymentMethodFilterDto = z.object({
	q: zq.search,
	category: PaymentMethodCategoryDto.optional(),
	isEnabled: zp.bool.optional(),
	isGlobal: zp.bool.optional(),
	...zq.pagination.shape,
})
export type PaymentMethodFilterDto = z.infer<typeof PaymentMethodFilterDto>

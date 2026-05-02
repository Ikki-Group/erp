import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

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

export const PaymentMethodConfigDto = z.object({
	...zc.RecordId.shape,
	type: PaymentMethodTypeDto,
	category: PaymentMethodCategoryDto,
	name: zp.str,
	isEnabled: zp.bool,
	isDefault: zp.bool,
	...zc.AuditBasic.shape,
})
export type PaymentMethodConfigDto = z.infer<typeof PaymentMethodConfigDto>

export const PaymentMethodConfigCreateDto = z.object({
	type: PaymentMethodTypeDto,
	category: PaymentMethodCategoryDto,
	name: zc.strTrim.min(2).max(100),
	isEnabled: zp.bool.default(true),
	isDefault: zp.bool.default(false),
})
export type PaymentMethodConfigCreateDto = z.infer<typeof PaymentMethodConfigCreateDto>

export const PaymentMethodConfigUpdateDto = z.object({
	...zc.RecordId.shape,
	...PaymentMethodConfigCreateDto.shape,
})
export type PaymentMethodConfigUpdateDto = z.infer<typeof PaymentMethodConfigUpdateDto>

export const PaymentMethodConfigFilterDto = z.object({
	q: zq.search,
	category: PaymentMethodCategoryDto.optional(),
	isEnabled: zp.bool.optional(),
	...zq.pagination.shape,
})
export type PaymentMethodConfigFilterDto = z.infer<typeof PaymentMethodConfigFilterDto>

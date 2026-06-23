import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema'

export const PaymentProviderDto = z.object({
	...zc.RecordId.shape,
	code: zp.str,
	name: zp.str,
	description: zp.strNullable,
	websiteUrl: zp.strNullable,
	isActive: zp.bool,
	isSystem: zp.bool,
	...zc.AuditBasic.shape,
})
export type PaymentProviderDto = z.infer<typeof PaymentProviderDto>

export const PaymentProviderCreateDto = z.object({
	code: zc.strTrim
		.min(2)
		.max(20)
		.transform((v) => v.toUpperCase()),
	name: zc.strTrim.min(2).max(100),
	description: zc.strTrimNullable,
	websiteUrl: zc.strTrim.url().nullable().optional(),
	isActive: zp.bool.default(true),
	isSystem: zp.bool.default(false),
})
export type PaymentProviderCreateDto = z.infer<typeof PaymentProviderCreateDto>

export const PaymentProviderUpdateDto = z.object({
	...zc.RecordId.shape,
	...PaymentProviderCreateDto.shape,
})
export type PaymentProviderUpdateDto = z.infer<typeof PaymentProviderUpdateDto>

export const PaymentProviderFilterDto = z.object({
	q: zq.search,
	isActive: zp.bool.optional(),
	isSystem: zp.bool.optional(),
	...zq.pagination.shape,
})
export type PaymentProviderFilterDto = z.infer<typeof PaymentProviderFilterDto>

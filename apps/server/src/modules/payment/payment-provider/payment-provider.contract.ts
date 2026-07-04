import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema'

export const PaymentProviderDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	description: zp.str.nullable(),
	websiteUrl: zp.str.nullable(),
	isActive: zp.bool,
	isSystem: zp.bool,
	...zc.AuditBasic.shape,
})
export type PaymentProviderDto = z.infer<typeof PaymentProviderDto>

const PaymentProviderMutationDto = z.object({
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

export const PaymentProviderCreateDto = PaymentProviderMutationDto
export type PaymentProviderCreateDto = z.infer<typeof PaymentProviderCreateDto>

export const PaymentProviderUpdateDto = z.object({
	id: zp.id,
	...PaymentProviderMutationDto.shape,
})
export type PaymentProviderUpdateDto = z.infer<typeof PaymentProviderUpdateDto>

export const PaymentProviderFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	isActive: zp.bool.optional(),
	isSystem: zp.bool.optional(),
})
export type PaymentProviderFilterDto = z.infer<typeof PaymentProviderFilterDto>

import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema'

export const LocationPaymentMethodCredentialsDto = z.object({
	merchantId: zc.strTrim.optional(),
	apiKey: zc.strTrim.optional(),
	accountNumber: zc.strTrim.optional(),
	terminalId: zc.strTrim.optional(),
})
export type LocationPaymentMethodCredentialsDto = z.infer<
	typeof LocationPaymentMethodCredentialsDto
>

export const LocationPaymentMethodConfigDto = z.object({
	minAmount: zp.num.optional(),
	maxAmount: zp.num.optional(),
	feePercentage: zp.num.optional(),
	fixedFee: zp.num.optional(),
})
export type LocationPaymentMethodConfigDto = z.infer<typeof LocationPaymentMethodConfigDto>

export const LocationPaymentMethodDto = z.object({
	...zc.RecordId.shape,
	locationId: zp.num,
	paymentMethodId: zp.num,
	paymentProviderId: zp.num.nullable(),
	isEnabled: zp.bool,
	isDefault: zp.bool,
	credentials: LocationPaymentMethodCredentialsDto.nullable(),
	config: LocationPaymentMethodConfigDto.nullable(),
	enabledAt: zp.dateNullable,
	...zc.AuditBasic.shape,
})
export type LocationPaymentMethodDto = z.infer<typeof LocationPaymentMethodDto>

export const LocationPaymentMethodCreateDto = z.object({
	locationId: zp.num,
	paymentMethodId: zp.num,
	paymentProviderId: zp.num.nullable(),
	isEnabled: zp.bool.default(true),
	isDefault: zp.bool.default(false),
	credentials: LocationPaymentMethodCredentialsDto.optional(),
	config: LocationPaymentMethodConfigDto.optional(),
})
export type LocationPaymentMethodCreateDto = z.infer<typeof LocationPaymentMethodCreateDto>

export const LocationPaymentMethodUpdateDto = z.object({
	...zc.RecordId.shape,
	...LocationPaymentMethodCreateDto.shape,
})
export type LocationPaymentMethodUpdateDto = z.infer<typeof LocationPaymentMethodUpdateDto>

export const LocationPaymentMethodFilterDto = z.object({
	locationId: zp.num.optional(),
	paymentMethodId: zp.num.optional(),
	paymentProviderId: zp.num.optional(),
	isEnabled: zp.bool.optional(),
	...zq.pagination.shape,
})
export type LocationPaymentMethodFilterDto = z.infer<typeof LocationPaymentMethodFilterDto>

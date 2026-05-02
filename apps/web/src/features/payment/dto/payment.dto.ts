import { z } from 'zod'

import { zc, zq, zp } from '@/lib/validation'

export const PaymentTypeDto = z.enum([
	/** Outgoing payment to suppliers/vendors. */
	'payable',
	/** Incoming payment from customers. */
	'receivable',
])
export type PaymentTypeDto = z.infer<typeof PaymentTypeDto>

/** Payment methods. */
export const PaymentMethodDto = z.enum([
	'cash',
	'bank_transfer',
	'credit_card',
	'debit_card',
	'e_wallet',
])
export type PaymentMethodDto = z.infer<typeof PaymentMethodDto>

export const PaymentDto = z.object({
	...zc.RecordId.shape,
	type: PaymentTypeDto,
	date: zp.date,
	referenceNo: zp.strNullable,
	accountId: zp.num,
	method: PaymentMethodDto,
	amount: zp.decimal,
	notes: zp.strNullable,
	...zc.AuditBasic.shape,
})
export type PaymentDto = z.infer<typeof PaymentDto>

export const PaymentCreateDto = z.object({
	type: PaymentTypeDto,
	date: zp.date,
	referenceNo: zc.strTrimNullable,
	accountId: zp.num,
	method: PaymentMethodDto,
	amount: zp.decimal,
	notes: zc.strTrimNullable,
})
export type PaymentCreateDto = z.infer<typeof PaymentCreateDto>

export const PaymentUpdateDto = z.object({ ...zc.RecordId.shape, ...PaymentCreateDto.shape })
export type PaymentUpdateDto = z.infer<typeof PaymentUpdateDto>

export const PaymentFilterDto = z.object({
	q: zq.search,
	type: PaymentTypeDto.optional(),
	method: PaymentMethodDto.optional(),
	accountId: zp.num.optional(),
	dateFrom: zp.date.optional(),
	dateTo: zp.date.optional(),
	...zq.pagination.shape,
})
export type PaymentFilterDto = z.infer<typeof PaymentFilterDto>

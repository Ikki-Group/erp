import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

/** Types of payment transactions. */
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

/** Payment invoice allocation DTO. */
export const PaymentInvoiceDto = z.object({
	...zc.RecordId.shape,
	paymentId: zp.num,
	salesInvoiceId: zp.num.nullable(),
	purchaseInvoiceId: zp.num.nullable(),
	amount: zp.decimal,
	...zc.AuditBasic.shape,
})
export type PaymentInvoiceDto = z.infer<typeof PaymentInvoiceDto>

export const PaymentInvoiceCreateDto = z
	.object({
		paymentId: zp.num,
		salesInvoiceId: zp.num.nullable(),
		purchaseInvoiceId: zp.num.nullable(),
		amount: zp.decimal,
	})
	.refine((data) => data.salesInvoiceId !== null || data.purchaseInvoiceId !== null, {
		message: 'Either salesInvoiceId or purchaseInvoiceId must be provided',
	})
	.refine((data) => !(data.salesInvoiceId && data.purchaseInvoiceId), {
		message: 'Cannot allocate to both sales and purchase invoice simultaneously',
	})
export type PaymentInvoiceCreateDto = z.infer<typeof PaymentInvoiceCreateDto>

export const PaymentInvoiceUpdateDto = z.object({
	...zc.RecordId.shape,
	...PaymentInvoiceCreateDto.shape,
})
export type PaymentInvoiceUpdateDto = z.infer<typeof PaymentInvoiceUpdateDto>

import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

import { invoiceStatusEnum } from '@/db/schema/_helpers'

/** Sales invoice status */
export const SalesInvoiceStatusDto = z.enum(['draft', 'open', 'paid', 'void'])
export type SalesInvoiceStatusDto = z.infer<typeof SalesInvoiceStatusDto>

export const SalesInvoiceDto = z.object({
	...zc.RecordId.shape,
	orderId: zp.id,
	customerId: zp.id.nullable(),
	locationId: zp.id,
	status: SalesInvoiceStatusDto,
	invoiceDate: zp.date,
	dueDate: zp.dateNullable,
	totalAmount: zc.numberCurrency,
	taxAmount: zc.numberCurrency,
	discountAmount: zc.numberCurrency,
	notes: zp.strNullable,
	...zc.AuditBasic.shape,
})
export type SalesInvoiceDto = z.infer<typeof SalesInvoiceDto>

export const SalesInvoiceItemDto = z.object({
	...zc.RecordId.shape,
	invoiceId: zp.id,
	salesOrderItemId: zp.id.nullable(),
	productId: zp.id.nullable(),
	variantId: zp.id.nullable(),
	itemName: zp.str,
	quantity: zp.decimal,
	unitPrice: zc.numberCurrency,
	taxAmount: zc.numberCurrency,
	discountAmount: zc.numberCurrency,
	subtotal: zc.numberCurrency,
	...zc.AuditBasic.shape,
})
export type SalesInvoiceItemDto = z.infer<typeof SalesInvoiceItemDto>

export const SalesInvoiceWithItemsDto = z.object({
	invoice: SalesInvoiceDto,
	items: SalesInvoiceItemDto.array(),
})
export type SalesInvoiceWithItemsDto = z.infer<typeof SalesInvoiceWithItemsDto>

export const SalesInvoiceCreateDto = z.object({
	orderId: zp.id,
	customerId: zp.id.optional(),
	dueDate: zp.date.optional(),
	notes: zc.strTrim.min(5).max(1000).optional().or(z.literal('')),
})
export type SalesInvoiceCreateDto = z.infer<typeof SalesInvoiceCreateDto>

export const SalesInvoiceUpdateDto = z.object({
	...zc.RecordId.shape,
	status: SalesInvoiceStatusDto.optional(),
	dueDate: zp.date.optional(),
	notes: zc.strTrim.min(5).max(1000).optional().or(z.literal('')),
})
export type SalesInvoiceUpdateDto = z.infer<typeof SalesInvoiceUpdateDto>

export const SalesInvoiceFilterDto = z.object({
	q: zq.search,
	status: SalesInvoiceStatusDto.optional(),
	customerId: zp.id.optional(),
	locationId: zp.id.optional(),
	fromDate: zp.date.optional(),
	toDate: zp.date.optional(),
	...zq.pagination.shape,
})
export type SalesInvoiceFilterDto = z.infer<typeof SalesInvoiceFilterDto>

/** Generate invoice from sales order */
export const SalesInvoiceGenerateDto = z.object({
	orderId: zp.id,
	customerId: zp.id.optional(),
	dueDate: zp.date.optional(),
	notes: zc.strTrim.min(5).max(1000).optional().or(z.literal('')),
})
export type SalesInvoiceGenerateDto = z.infer<typeof SalesInvoiceGenerateDto>

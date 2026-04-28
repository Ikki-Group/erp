import z from 'zod'

import { zp, zc, zq } from '@/lib/validation'

/* ---------------------------------- ENUM ---------------------------------- */

export const SalesOrderStatusDto = z.enum(['open', 'closed', 'void'])
export type SalesOrderStatusDto = z.infer<typeof SalesOrderStatusDto>

/* --------------------------------- NESTED --------------------------------- */

export const SalesOrderBatchDto = z.object({
	...zc.RecordId.shape,
	orderId: zp.id,
	batchNumber: zp.num,
	status: zp.str,
	...zc.AuditFull.shape,
})
export type SalesOrderBatchDto = z.infer<typeof SalesOrderBatchDto>

export const SalesOrderItemDto = z.object({
	...zc.RecordId.shape,
	orderId: zp.id,
	batchId: zp.id.nullable(),
	productId: zp.id.nullable(),
	variantId: zp.id.nullable(),
	itemName: zp.str,
	quantity: zp.decimal,
	unitPrice: zp.decimal,
	discountAmount: zp.decimal,
	taxAmount: zp.decimal,
	subtotal: zp.decimal,
	...zc.AuditFull.shape,
})
export type SalesOrderItemDto = z.infer<typeof SalesOrderItemDto>

export const SalesVoidDto = z.object({
	...zc.RecordId.shape,
	orderId: zp.id,
	itemId: zp.id.nullable(),
	reason: zp.strNullable,
	voidedBy: zp.id,
	...zc.AuditFull.shape,
})
export type SalesVoidDto = z.infer<typeof SalesVoidDto>

export const SalesExternalRefDto = z.object({
	...zc.RecordId.shape,
	orderId: zp.id,
	externalSource: zp.str,
	externalOrderId: zp.str,
	rawPayload: z.any().nullable(),
	...zc.AuditFull.shape,
})
export type SalesExternalRefDto = z.infer<typeof SalesExternalRefDto>

/* --------------------------------- ENTITY --------------------------------- */

export const SalesOrderDto = z.object({
	...zc.RecordId.shape,
	locationId: zp.id,
	customerId: zp.id.nullable(),
	salesTypeId: zp.id,
	status: SalesOrderStatusDto,
	transactionDate: zp.date,
	totalAmount: zp.decimal,
	discountAmount: zp.decimal,
	taxAmount: zp.decimal,
	...zc.AuditFull.shape,
})

export type SalesOrderDto = z.infer<typeof SalesOrderDto>

/* --------------------------------- FILTER --------------------------------- */

export const SalesOrderFilterDto = z.object({
	q: zq.search,
	locationId: zp.id.optional(),
	status: SalesOrderStatusDto.optional(),
	salesTypeId: zp.id.optional(),
	startDate: zp.date.optional(),
	endDate: zp.date.optional(),
})

export type SalesOrderFilterDto = z.infer<typeof SalesOrderFilterDto>

/* ---------------------------------- OUTPUT -------------------------------- */

export const SalesOrderSelectDto = SalesOrderDto.extend({
	batches: SalesOrderBatchDto.array().optional(),
	items: SalesOrderItemDto.array().optional(),
	voids: SalesVoidDto.array().optional(),
	externalRefs: SalesExternalRefDto.array().optional(),
})

export type SalesOrderSelectDto = z.infer<typeof SalesOrderSelectDto>

/* --------------------------------- CREATE --------------------------------- */

export const SalesOrderCreateDto = SalesOrderDto.pick({
	locationId: true,
	customerId: true,
	salesTypeId: true,
	status: true,
	transactionDate: true,
	totalAmount: true,
	discountAmount: true,
	taxAmount: true,
}).extend({
	items: z
		.array(
			SalesOrderItemDto.pick({
				batchId: true,
				productId: true,
				variantId: true,
				itemName: true,
				quantity: true,
				unitPrice: true,
				discountAmount: true,
				taxAmount: true,
				subtotal: true,
			}).partial({ batchId: true, productId: true, variantId: true }),
		)
		.optional(),
})

export type SalesOrderCreateDto = z.infer<typeof SalesOrderCreateDto>

/* --------------------------------- UPDATE --------------------------------- */

export const SalesOrderUpdateDto = SalesOrderCreateDto.partial().extend({ id: zp.id })

export type SalesOrderUpdateDto = z.infer<typeof SalesOrderUpdateDto>

/* --------------------------------- ACTIONS -------------------------------- */

export const SalesOrderAddBatchDto = z.object({
	batchNumber: zp.num,
	items: z.array(
		SalesOrderItemDto.pick({
			productId: true,
			variantId: true,
			itemName: true,
			quantity: true,
			unitPrice: true,
			discountAmount: true,
			taxAmount: true,
			subtotal: true,
		}).partial({ productId: true, variantId: true }),
	),
})
export type SalesOrderAddBatchDto = z.infer<typeof SalesOrderAddBatchDto>

export const SalesOrderVoidDto = z.object({ itemId: zp.id.optional(), reason: zp.str })
export type SalesOrderVoidDto = z.infer<typeof SalesOrderVoidDto>

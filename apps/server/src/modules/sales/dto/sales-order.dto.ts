import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

/* ---------------------------------- ENUM ---------------------------------- */

export const SalesOrderStatusEnum = z.enum(['open', 'closed', 'void'])
export type SalesOrderStatus = z.infer<typeof SalesOrderStatusEnum>

/* ---------------------------------- NESTED ---------------------------------- */

export const SalesOrderBatchDto = z.object({
	...zc.RecordId.shape,
	orderId: zp.id,
	batchNumber: zp.num,
	status: zp.str,
	...zc.AuditBasic.shape,
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
	...zc.AuditBasic.shape,
})
export type SalesOrderItemDto = z.infer<typeof SalesOrderItemDto>

export const SalesVoidDto = z.object({
	...zc.RecordId.shape,
	orderId: zp.id,
	itemId: zp.id.nullable(),
	reason: zp.strNullable,
	voidedBy: zp.id,
	...zc.AuditBasic.shape,
})
export type SalesVoidDto = z.infer<typeof SalesVoidDto>

export const SalesExternalRefDto = z.object({
	...zc.RecordId.shape,
	orderId: zp.id,
	externalSource: zp.str,
	externalOrderId: zp.str,
	rawPayload: z.any().nullable(),
	...zc.AuditBasic.shape,
})
export type SalesExternalRefDto = z.infer<typeof SalesExternalRefDto>

/* ---------------------------------- ENTITY ---------------------------------- */

export const SalesOrderDto = z.object({
	...zc.RecordId.shape,
	locationId: zp.id,
	customerId: zp.id.nullable(),
	salesTypeId: zp.id,
	status: SalesOrderStatusEnum,
	transactionDate: zp.date,
	totalAmount: zp.decimal,
	discountAmount: zp.decimal,
	taxAmount: zp.decimal,
	...zc.AuditBasic.shape,
})
export type SalesOrderDto = z.infer<typeof SalesOrderDto>

/* ---------------------------------- OUTPUT ---------------------------------- */

export const SalesOrderOutputDto = SalesOrderDto.extend({
	batches: z.array(SalesOrderBatchDto).optional(),
	items: z.array(SalesOrderItemDto).optional(),
	voids: z.array(SalesVoidDto).optional(),
	externalRefs: z.array(SalesExternalRefDto).optional(),
})
export type SalesOrderOutputDto = z.infer<typeof SalesOrderOutputDto>

/* ---------------------------------- FILTER ---------------------------------- */

export const SalesOrderFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	locationId: zq.id.optional(),
	status: SalesOrderStatusEnum.optional(),
	salesTypeId: zq.id.optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
})
export type SalesOrderFilterDto = z.infer<typeof SalesOrderFilterDto>

/* ---------------------------------- MUTATION ---------------------------------- */

const SalesOrderItemMutationDto = z.object({
	batchId: zp.id.optional().nullable(),
	productId: zp.id.optional().nullable(),
	variantId: zp.id.optional().nullable(),
	itemName: zc.strTrim.min(1).max(255),
	quantity: zp.decimal.refine((v) => Number(v) > 0, "Must be greater than 0"),
	unitPrice: zp.decimal.refine((v) => Number(v) >= 0, "Must be non-negative"),
	discountAmount: zp.decimal.default('0'),
	taxAmount: zp.decimal.default('0'),
	subtotal: zp.decimal,
})

export const SalesOrderMutationDto = z.object({
	locationId: zp.id,
	customerId: zp.id.optional().nullable(),
	salesTypeId: zp.id,
	status: SalesOrderStatusEnum.default('open'),
	transactionDate: zp.date.default(() => new Date()),
	totalAmount: zp.decimal,
	discountAmount: zp.decimal.default('0'),
	taxAmount: zp.decimal.default('0'),
	items: z.array(SalesOrderItemMutationDto).optional(),
})
export type SalesOrderMutationDto = z.infer<typeof SalesOrderMutationDto>

export const SalesOrderCreateDto = SalesOrderMutationDto
export type SalesOrderCreateDto = z.infer<typeof SalesOrderCreateDto>

export const SalesOrderUpdateDto = SalesOrderMutationDto.extend({
	...zc.RecordId.shape,
})
export type SalesOrderUpdateDto = z.infer<typeof SalesOrderUpdateDto>

/* ----------------------------------- VOID ----------------------------------- */

export const SalesOrderVoidDto = z.object({
	itemId: zp.id.optional(),
	reason: zc.strTrim.min(3),
})
export type SalesOrderVoidDto = z.infer<typeof SalesOrderVoidDto>

/* ----------------------------------- BATCH ----------------------------------- */

export const SalesOrderAddBatchDto = z.object({
	batchNumber: zp.num,
	items: z.array(SalesOrderItemMutationDto),
})
export type SalesOrderAddBatchDto = z.infer<typeof SalesOrderAddBatchDto>

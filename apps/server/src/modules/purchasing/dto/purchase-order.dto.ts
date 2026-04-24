import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

/* ---------------------------------- ENUM ---------------------------------- */

export const PurchaseOrderStatusEnum = z.enum(['open', 'closed', 'void'])
export type PurchaseOrderStatus = z.infer<typeof PurchaseOrderStatusEnum>

/* ---------------------------------- ITEM ---------------------------------- */

export const PurchaseOrderItemDto = z.object({
	...zc.RecordId.shape,
	orderId: zp.id,
	materialId: zp.id.nullable().optional(),
	itemName: zp.str,
	quantity: zp.decimal,
	unitPrice: zp.decimal,
	discountAmount: zp.decimal,
	taxAmount: zp.decimal,
	subtotal: zp.decimal,
	...zc.AuditBasic.shape,
})
export type PurchaseOrderItemDto = z.infer<typeof PurchaseOrderItemDto>

/* ---------------------------------- ENTITY --------------------------------- */

export const PurchaseOrderDto = z.object({
	...zc.RecordId.shape,
	locationId: zp.id,
	supplierId: zp.id,
	status: PurchaseOrderStatusEnum,
	transactionDate: zp.date,
	expectedDeliveryDate: zp.date.nullable().optional(),
	totalAmount: zp.decimal,
	discountAmount: zp.decimal,
	taxAmount: zp.decimal,
	notes: zp.strNullable,
	items: z.array(PurchaseOrderItemDto),
	...zc.AuditBasic.shape,
})
export type PurchaseOrderDto = z.infer<typeof PurchaseOrderDto>
export const PurchaseOrderSelectDto = PurchaseOrderDto.omit({ items: true })
export type PurchaseOrderSelectDto = z.infer<typeof PurchaseOrderSelectDto>

/* -------------------------------- MUTATION -------------------------------- */

const PurchaseOrderItemMutationDto = z.object({
	materialId: zp.id.optional().nullable(),
	itemName: zc.strTrim.min(1).max(255),
	quantity: zp.decimal.gt(0),
	unitPrice: zp.decimal.nonnegative(),
	discountAmount: zp.decimal.default(0),
	taxAmount: zp.decimal.default(0),
	subtotal: zp.decimal,
})

const PurchaseOrderMutationDto = z.object({
	locationId: zp.id,
	supplierId: zp.id,
	status: PurchaseOrderStatusEnum.default('open'),
	transactionDate: zp.date.default(() => new Date()),
	expectedDeliveryDate: zp.date.nullable().optional(),
	totalAmount: zp.decimal,
	discountAmount: zp.decimal.default(0),
	taxAmount: zp.decimal.default(0),
	notes: zc.strTrimNullable,
	items: z.array(PurchaseOrderItemMutationDto.extend({ id: zp.id.optional() })).min(1),
})

export const PurchaseOrderCreateDto = PurchaseOrderMutationDto
export type PurchaseOrderCreateDto = z.infer<typeof PurchaseOrderCreateDto>

export const PurchaseOrderUpdateDto = PurchaseOrderMutationDto.extend({
	...zc.RecordId.shape,
})
export type PurchaseOrderUpdateDto = z.infer<typeof PurchaseOrderUpdateDto>

/* --------------------------------- FILTER --------------------------------- */

export const PurchaseOrderFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	status: PurchaseOrderStatusEnum.optional(),
	locationId: zq.id.optional(),
	supplierId: zq.id.optional(),
})
export type PurchaseOrderFilterDto = z.infer<typeof PurchaseOrderFilterDto>

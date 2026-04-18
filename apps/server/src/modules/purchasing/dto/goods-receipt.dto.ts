import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

/* ---------------------------------- ENUM ---------------------------------- */

export const GoodsReceiptStatusEnum = z.enum(['open', 'completed', 'void'])
export type GoodsReceiptStatus = z.infer<typeof GoodsReceiptStatusEnum>

/* ---------------------------------- ITEM ---------------------------------- */

export const GoodsReceiptNoteItemDto = z.object({
	...zc.RecordId.shape,
	grnId: zp.id,
	purchaseOrderItemId: zp.id,
	materialId: zp.id.nullable().optional(),
	itemName: zp.str,
	quantityReceived: zp.decimal,
	notes: zp.strNullable,
	...zc.AuditBasic.shape,
})
export type GoodsReceiptNoteItemDto = z.infer<typeof GoodsReceiptNoteItemDto>

/* ---------------------------------- ENTITY --------------------------------- */

export const GoodsReceiptNoteDto = z.object({
	...zc.RecordId.shape,
	orderId: zp.id,
	locationId: zp.id,
	supplierId: zp.id,
	receiveDate: zp.date,
	status: GoodsReceiptStatusEnum,
	referenceNumber: zp.strNullable,
	notes: zp.strNullable,
	items: z.array(GoodsReceiptNoteItemDto),
	...zc.AuditBasic.shape,
})
export type GoodsReceiptNoteDto = z.infer<typeof GoodsReceiptNoteDto>

/* -------------------------------- MUTATION -------------------------------- */

const GoodsReceiptNoteItemMutationDto = z.object({
	purchaseOrderItemId: zp.id,
	materialId: zp.id.optional().nullable(),
	itemName: zc.strTrim.min(1).max(255),
	quantityReceived: zp.decimal.gt(0),
	notes: zc.strTrimNullable,
})

const GoodsReceiptNoteMutationDto = z.object({
	orderId: zp.id,
	locationId: zp.id,
	supplierId: zp.id,
	receiveDate: zp.date.default(() => new Date()),
	status: GoodsReceiptStatusEnum.default('open'),
	referenceNumber: zc.strTrimNullable,
	notes: zc.strTrimNullable,
	items: z.array(GoodsReceiptNoteItemMutationDto).min(1),
})

export const GoodsReceiptNoteCreateDto = GoodsReceiptNoteMutationDto
export type GoodsReceiptNoteCreateDto = z.infer<typeof GoodsReceiptNoteCreateDto>

export const GoodsReceiptNoteUpdateDto = GoodsReceiptNoteMutationDto.extend({
	...zc.RecordId.shape,
})
export type GoodsReceiptNoteUpdateDto = z.infer<typeof GoodsReceiptNoteUpdateDto>

/* --------------------------------- FILTER --------------------------------- */

export const GoodsReceiptNoteFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	status: GoodsReceiptStatusEnum.optional(),
	orderId: zq.id.optional(),
	locationId: zq.id.optional(),
	supplierId: zq.id.optional(),
})
export type GoodsReceiptNoteFilterDto = z.infer<typeof GoodsReceiptNoteFilterDto>

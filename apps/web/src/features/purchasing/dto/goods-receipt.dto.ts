import { z } from 'zod'

import { zp, zc, zq } from '@/lib/validation'

export const GoodsReceiptStatusEnum = z.enum(['open', 'completed', 'void'])
export type GoodsReceiptStatusEnum = z.infer<typeof GoodsReceiptStatusEnum>

export const GoodsReceiptNoteItemBaseDto = z.object({
	purchaseOrderItemId: z.number(),
	materialId: z.number().nullable().optional(),
	itemName: zp.str.min(1).max(255),
	quantityReceived: z.string().or(z.number()),
	notes: zp.strNullable.optional(),
})
export type GoodsReceiptNoteItemBaseDto = z.infer<typeof GoodsReceiptNoteItemBaseDto>

export const GoodsReceiptNoteBaseDto = z.object({
	orderId: z.number(),
	locationId: z.number(),
	supplierId: z.number(),
	receiveDate: z.coerce.date(),
	status: GoodsReceiptStatusEnum.default('open'),
	referenceNumber: zp.strNullable.optional(),
	notes: zp.strNullable.optional(),
})
export type GoodsReceiptNoteBaseDto = z.infer<typeof GoodsReceiptNoteBaseDto>

export const GoodsReceiptNoteItemDto = z.object({
	...zc.RecordId.shape,
	grnId: z.number(),
	...GoodsReceiptNoteItemBaseDto.shape,
	...zc.AuditFull.shape,
})
export type GoodsReceiptNoteItemDto = z.infer<typeof GoodsReceiptNoteItemDto>

export const GoodsReceiptNoteDto = z.object({
	...zc.RecordId.shape,
	...GoodsReceiptNoteBaseDto.shape,
	items: z.array(GoodsReceiptNoteItemDto),
	...zc.AuditFull.shape,
})
export type GoodsReceiptNoteDto = z.infer<typeof GoodsReceiptNoteDto>

export const GoodsReceiptNoteCreateItemDto = z.object({ ...GoodsReceiptNoteItemBaseDto.shape })
export type GoodsReceiptNoteCreateItemDto = z.infer<typeof GoodsReceiptNoteCreateItemDto>

export const GoodsReceiptNoteCreateDto = z.object({
	...GoodsReceiptNoteBaseDto.shape,
	items: z.array(GoodsReceiptNoteCreateItemDto).min(1),
})
export type GoodsReceiptNoteCreateDto = z.infer<typeof GoodsReceiptNoteCreateDto>

export const GoodsReceiptNoteFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	status: GoodsReceiptStatusEnum.optional(),
	orderId: zq.id.optional(),
	locationId: zq.id.optional(),
	supplierId: zq.id.optional(),
})
export type GoodsReceiptNoteFilterDto = z.infer<typeof GoodsReceiptNoteFilterDto>

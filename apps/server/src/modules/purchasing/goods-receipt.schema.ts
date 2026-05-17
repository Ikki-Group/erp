import { z, zc, zp, zq } from '@ikki/api-contract/validation'

/* ---------------------------------- ENUM ---------------------------------- */

export const GoodsReceiptStatusEnum = z.enum(['open', 'completed', 'void'])
export type GoodsReceiptStatus = z.infer<typeof GoodsReceiptStatusEnum>

/* ---------------------------------- ITEM ---------------------------------- */

export const GoodsReceiptNoteItemSchema = z.object({
	...zc.RecordId.shape,
	grnId: zp.id,
	purchaseOrderItemId: zp.id,
	materialId: zp.id.nullable().optional(),
	itemName: zp.str,
	quantityReceived: zp.decimal,
	notes: zp.strNullable,
	...zc.AuditBasic.shape,
})
export type GoodsReceiptNoteItemSchema = z.infer<typeof GoodsReceiptNoteItemSchema>

/* ---------------------------------- ENTITY ---------------------------------- */

export const GoodsReceiptNoteSchema = z.object({
	...zc.RecordId.shape,
	orderId: zp.id,
	locationId: zp.id,
	supplierId: zp.id,
	receiveDate: zp.date,
	status: GoodsReceiptStatusEnum,
	referenceNumber: zp.strNullable,
	notes: zp.strNullable,
	items: z.array(GoodsReceiptNoteItemSchema),
	...zc.AuditBasic.shape,
})
export type GoodsReceiptNoteSchema = z.infer<typeof GoodsReceiptNoteSchema>
export const GoodsReceiptNoteSelectSchema = GoodsReceiptNoteSchema.omit({ items: true })
export type GoodsReceiptNoteSelectSchema = z.infer<typeof GoodsReceiptNoteSelectSchema>

/* -------------------------------- MUTATION -------------------------------- */

const GoodsReceiptNoteItemMutationSchema = z.object({
	purchaseOrderItemId: zp.id,
	materialId: zp.id.optional().nullable(),
	itemName: zc.strTrim.min(1).max(255),
	quantityReceived: zp.decimal.refine((v) => Number(v) > 0, 'Must be greater than 0'),
	notes: zc.strTrimNullable,
})

const GoodsReceiptNoteMutationSchema = z.object({
	orderId: zp.id,
	locationId: zp.id,
	supplierId: zp.id,
	receiveDate: zp.date.default(() => new Date()),
	status: GoodsReceiptStatusEnum.default('open'),
	referenceNumber: zc.strTrimNullable,
	notes: zc.strTrimNullable,
	items: z.array(GoodsReceiptNoteItemMutationSchema).min(1),
})

export const GoodsReceiptNoteCreateSchema = GoodsReceiptNoteMutationSchema
export type GoodsReceiptNoteCreateSchema = z.infer<typeof GoodsReceiptNoteCreateSchema>

export const GoodsReceiptNoteUpdateSchema = GoodsReceiptNoteMutationSchema.extend({
	...zc.RecordId.shape,
})
export type GoodsReceiptNoteUpdateSchema = z.infer<typeof GoodsReceiptNoteUpdateSchema>

/* --------------------------------- FILTER --------------------------------- */

export const GoodsReceiptNoteFilterSchema = z.object({
	...zq.pagination.shape,
	q: zq.search,
	status: GoodsReceiptStatusEnum.optional(),
	orderId: zq.id.optional(),
	locationId: zq.id.optional(),
	supplierId: zq.id.optional(),
})
export type GoodsReceiptNoteFilterSchema = z.infer<typeof GoodsReceiptNoteFilterSchema>

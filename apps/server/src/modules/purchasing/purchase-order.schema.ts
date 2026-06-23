import { z } from 'zod'
import { zc, zp, zq } from '@/shared/schema'

/* ---------------------------------- ENUM ---------------------------------- */

export const PurchaseOrderStatusEnum = z.enum([
	'pending_approval',
	'approved',
	'rejected',
	'open',
	'closed',
	'void',
])
export type PurchaseOrderStatus = z.infer<typeof PurchaseOrderStatusEnum>

/* ---------------------------------- ITEM ---------------------------------- */

export const PurchaseOrderItemSchema = z.object({
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
export type PurchaseOrderItemSchema = z.infer<typeof PurchaseOrderItemSchema>

/* ---------------------------------- ENTITY ---------------------------------- */

export const PurchaseOrderSchema = z.object({
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
	items: z.array(PurchaseOrderItemSchema),
	...zc.AuditBasic.shape,
})
export type PurchaseOrderSchema = z.infer<typeof PurchaseOrderSchema>
export const PurchaseOrderSelectSchema = PurchaseOrderSchema.omit({ items: true })
export type PurchaseOrderSelectSchema = z.infer<typeof PurchaseOrderSelectSchema>

/* -------------------------------- MUTATION -------------------------------- */

const PurchaseOrderItemMutationSchema = z.object({
	materialId: zp.id.optional().nullable(),
	itemName: zc.strTrim.min(1).max(255),
	quantity: zp.decimal.refine((v) => Number(v) > 0, 'Must be greater than 0'),
	unitPrice: zp.decimal.refine((v) => Number(v) >= 0, 'Must be non-negative'),
	discountAmount: zp.decimal.default('0'),
	taxAmount: zp.decimal.default('0'),
	subtotal: zp.decimal,
})

const PurchaseOrderMutationSchema = z.object({
	locationId: zp.id,
	supplierId: zp.id,
	status: PurchaseOrderStatusEnum.default('open'),
	transactionDate: zp.date.default(() => new Date()),
	expectedDeliveryDate: zp.date.nullable().optional(),
	totalAmount: zp.decimal,
	discountAmount: zp.decimal.default('0'),
	taxAmount: zp.decimal.default('0'),
	notes: zc.strTrimNullable,
	items: z.array(z.object({ ...PurchaseOrderItemMutationSchema.shape, id: zp.id.optional() })).min(1),
})

export const PurchaseOrderCreateSchema = PurchaseOrderMutationSchema
export type PurchaseOrderCreateSchema = z.infer<typeof PurchaseOrderCreateSchema>

export const PurchaseOrderUpdateSchema = z.object({
	...zc.RecordId.shape,
	...PurchaseOrderMutationSchema.shape,
})
export type PurchaseOrderUpdateSchema = z.infer<typeof PurchaseOrderUpdateSchema>

/* --------------------------------- FILTER --------------------------------- */

export const PurchaseOrderFilterSchema = z.object({
	...zq.pagination.shape,
	q: zq.search,
	status: PurchaseOrderStatusEnum.optional(),
	locationId: zq.id.optional(),
	supplierId: zq.id.optional(),
})
export type PurchaseOrderFilterSchema = z.infer<typeof PurchaseOrderFilterSchema>

/* -------------------------------- APPROVAL -------------------------------- */

export const PurchaseOrderApproveSchema = z.object({
	id: zp.id,
	notes: zc.strTrim.min(5).max(500).optional().or(z.literal('')),
})
export type PurchaseOrderApproveSchema = z.infer<typeof PurchaseOrderApproveSchema>

export const PurchaseOrderRejectSchema = z.object({
	id: zp.id,
	reason: zc.strTrim.min(5).max(500),
})
export type PurchaseOrderRejectSchema = z.infer<typeof PurchaseOrderRejectSchema>

export const PurchaseOrderSubmitForApprovalSchema = z.object({
	id: zp.id,
})
export type PurchaseOrderSubmitForApprovalSchema = z.infer<typeof PurchaseOrderSubmitForApprovalSchema>

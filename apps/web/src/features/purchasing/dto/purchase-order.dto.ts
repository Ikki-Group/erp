import { zp, zc, zq } from '@/lib/validation'

export const PurchaseOrderStatusDto = z.enum(['open', 'closed', 'void'])
export type PurchaseOrderStatusDto = z.infer<typeof PurchaseOrderStatusDto>

export const PurchaseOrderItemBaseDto = z.object({
	materialId: zp.id.nullable().optional(),
	itemName: zp.str,
	quantity: zp.decimal,
	unitPrice: zp.decimal,
	discountAmount: zp.decimal,
	taxAmount: zp.decimal,
	subtotal: zp.decimal,
})
export type PurchaseOrderItemBaseDto = z.infer<typeof PurchaseOrderItemBaseDto>

export const PurchaseOrderBaseDto = z.object({
	locationId: zp.id,
	supplierId: zp.id,
	status: PurchaseOrderStatusDto.default('open'),
	transactionDate: z.coerce.date(),
	expectedDeliveryDate: z.coerce.date().nullable().optional(),
	totalAmount: zp.decimal,
	discountAmount: zp.decimal,
	taxAmount: zp.decimal,
	notes: zp.strNullable.optional(),
})
export type PurchaseOrderBaseDto = z.infer<typeof PurchaseOrderBaseDto>

export const PurchaseOrderItemDto = z.object({
	...zc.RecordId.shape,
	orderId: zp.id,
	...PurchaseOrderItemBaseDto.shape,
	...zc.AuditFull.shape,
})
export type PurchaseOrderItemDto = z.infer<typeof PurchaseOrderItemDto>

export const PurchaseOrderDto = z.object({
	...zc.RecordId.shape,
	...PurchaseOrderBaseDto.shape,
	items: z.array(PurchaseOrderItemDto),
	...zc.AuditFull.shape,
})
export type PurchaseOrderDto = z.infer<typeof PurchaseOrderDto>

export const PurchaseOrderCreateItemDto = z.object({
	...PurchaseOrderItemBaseDto.shape,
	...zc.RecordId.partial().shape,
})
export type PurchaseOrderCreateItemDto = z.infer<typeof PurchaseOrderCreateItemDto>

export const PurchaseOrderCreateDto = z.object({
	...PurchaseOrderBaseDto.shape,
	items: z.array(PurchaseOrderCreateItemDto).min(1),
})
export type PurchaseOrderCreateDto = z.infer<typeof PurchaseOrderCreateDto>

export const PurchaseOrderUpdateDto = z.object({
	...zc.RecordId.shape,
	...PurchaseOrderBaseDto.partial().shape,
	items: z.array(PurchaseOrderCreateItemDto).optional(),
})
export type PurchaseOrderUpdateDto = z.infer<typeof PurchaseOrderUpdateDto>

export const PurchaseOrderFilterDto = z.object({
	...zq.pagination.shape,
	q: z.string().optional(),
	status: PurchaseOrderStatusDto.optional(),
	locationId: zp.id.optional(),
	supplierId: zp.id.optional(),
})
export type PurchaseOrderFilterDto = z.infer<typeof PurchaseOrderFilterDto>

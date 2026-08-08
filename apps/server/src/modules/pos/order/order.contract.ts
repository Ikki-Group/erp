import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema/index.ts'

// ─── Enums ───

export const OrderStatusEnum = z.enum(['open', 'completed', 'voided'])
export type OrderStatusEnum = z.infer<typeof OrderStatusEnum>

export const OrderTypeEnum = z.enum(['dine_in', 'takeaway'])
export type OrderTypeEnum = z.infer<typeof OrderTypeEnum>

export const OrderSourceEnum = z.enum(['internal', 'moka', 'manual'])
export type OrderSourceEnum = z.infer<typeof OrderSourceEnum>

export const OrderLineStatusEnum = z.enum(['active', 'voided'])
export type OrderLineStatusEnum = z.infer<typeof OrderLineStatusEnum>

// ─── Response: Order ───

export const OrderDto = z.object({
	id: zp.id,
	orderNo: zp.str,
	locationId: zp.id,
	tableId: z.number().int().positive().nullable(),
	shiftId: zp.id,
	type: OrderTypeEnum,
	billingMode: zp.str,
	status: OrderStatusEnum,
	subtotal: zp.str,
	discountAmount: zp.str,
	taxAmount: zp.str,
	total: zp.str,
	voucherId: z.number().int().positive().nullable(),
	voucherCode: zp.str.nullable(),
	customerId: z.number().int().positive().nullable(),
	source: OrderSourceEnum,
	externalRef: zp.str.nullable(),
	notes: zp.str.nullable(),
	orderedAt: zp.datetime,
	completedAt: zp.datetime.nullable(),
	...zc.AuditBasic.shape,
})
export type OrderDto = z.infer<typeof OrderDto>

// ─── Response: Order Line ───

export const OrderLineDto = z.object({
	id: zp.id,
	orderId: zp.id,
	menuItemId: zp.id,
	menuItemName: zp.str,
	quantity: zp.str,
	unitPrice: zp.str,
	modifiers: z.unknown().nullable(),
	modifierTotal: zp.str,
	discountAmount: zp.str,
	lineTotal: zp.str,
	status: OrderLineStatusEnum,
	notes: zp.str.nullable(),
})
export type OrderLineDto = z.infer<typeof OrderLineDto>

// ─── Response: Payment ───

export const OrderPaymentRecordDto = z.object({
	id: zp.id,
	orderId: zp.id,
	paymentMethodId: zp.id,
	amount: zp.str,
	reference: zp.str.nullable(),
	createdAt: zp.datetime,
})
export type OrderPaymentRecordDto = z.infer<typeof OrderPaymentRecordDto>

// ─── Response: Order Detail (with lines + payments) ───

export const OrderDetailDto = z.object({
	...OrderDto.shape,
	lines: z.array(OrderLineDto),
	payments: z.array(OrderPaymentRecordDto),
})
export type OrderDetailDto = z.infer<typeof OrderDetailDto>

// ─── Input: Create Order ───

export const OrderCreateDto = z.object({
	locationId: z.coerce.number().int().positive(),
	tableId: z.coerce.number().int().positive().nullable().optional(),
	type: OrderTypeEnum,
	notes: z.string().trim().max(1000).nullable().optional(),
})
export type OrderCreateDto = z.infer<typeof OrderCreateDto>

// ─── Input: Sync Lines ───

export const OrderLineInputDto = z.object({
	menuItemId: z.coerce.number().int().positive(),
	qty: z.coerce.number().positive(),
	modifierOptionIds: z.array(z.coerce.number().int().positive()).optional(),
	notes: z.string().trim().max(500).nullable().optional(),
})
export type OrderLineInputDto = z.infer<typeof OrderLineInputDto>

export const OrderLineSyncDto = z.object({
	orderId: z.coerce.number().int().positive(),
	lines: z.array(OrderLineInputDto).min(1),
})
export type OrderLineSyncDto = z.infer<typeof OrderLineSyncDto>

// ─── Input: Voucher ───

export const OrderApplyVoucherDto = z.object({
	orderId: z.coerce.number().int().positive(),
	voucherCode: zc.strTrim.max(50),
})
export type OrderApplyVoucherDto = z.infer<typeof OrderApplyVoucherDto>

export const OrderRemoveVoucherDto = z.object({
	orderId: z.coerce.number().int().positive(),
})
export type OrderRemoveVoucherDto = z.infer<typeof OrderRemoveVoucherDto>

// ─── Input: Payment ───

export const OrderPaymentDto = z.object({
	orderId: z.coerce.number().int().positive(),
	paymentMethodId: z.coerce.number().int().positive(),
	amount: z.coerce.number().positive(),
	reference: z.string().trim().max(255).nullable().optional(),
})
export type OrderPaymentDto = z.infer<typeof OrderPaymentDto>

// ─── Input: Complete / Void ───

export const OrderCompleteDto = z.object({
	orderId: z.coerce.number().int().positive(),
})
export type OrderCompleteDto = z.infer<typeof OrderCompleteDto>

export const OrderVoidDto = z.object({
	orderId: z.coerce.number().int().positive(),
	reason: zc.strTrim.min(3).max(500),
})
export type OrderVoidDto = z.infer<typeof OrderVoidDto>

// ─── Filter ───

export const OrderFilterDto = z.object({
	...zq.pagination.shape,
	locationId: z.coerce.number().int().positive(),
	status: OrderStatusEnum.optional(),
	shiftId: z.coerce.number().int().positive().optional(),
	q: zq.search,
})
export type OrderFilterDto = z.infer<typeof OrderFilterDto>

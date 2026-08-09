import { z } from 'zod'

import { zc, zp, zq } from '@/lib/validation/index.ts'

// ─── Table Enums ───

export const TableStatusEnum = z.enum(['available', 'occupied', 'reserved'])
export type TableStatusEnum = z.infer<typeof TableStatusEnum>

// ─── Table Response ───

export const TableDto = z.object({
	id: zp.id,
	locationId: zp.id,
	number: zp.str,
	capacity: zp.num,
	status: TableStatusEnum,
	isActive: zp.bool,
})
export type TableDto = z.infer<typeof TableDto>

// ─── Table Filter ───

export const TableFilterDto = z.object({
	...zq.pagination.shape,
	locationId: z.coerce.number().int().positive(),
	status: TableStatusEnum.optional(),
	q: zq.search,
})
export type TableFilterDto = z.infer<typeof TableFilterDto>

// ─── Table Create / Update ───

export const TableCreateDto = z.object({
	locationId: zp.id,
	number: zc.strTrim.min(1).max(50),
	capacity: z.coerce.number().int().positive().optional().default(4),
	isActive: z.boolean().optional().default(true),
})
export type TableCreateDto = z.infer<typeof TableCreateDto>

export const TableUpdateDto = z.object({
	id: zp.id,
	locationId: zp.id,
	number: zc.strTrim.min(1).max(50),
	capacity: z.coerce.number().int().positive().optional().default(4),
	isActive: z.boolean().optional().default(true),
})
export type TableUpdateDto = z.infer<typeof TableUpdateDto>

// ─── Shift Enums ───

export const ShiftStatusEnum = z.enum(['open', 'closed'])
export type ShiftStatusEnum = z.infer<typeof ShiftStatusEnum>

// ─── Shift Response ───

export const ShiftDto = z.object({
	id: zp.id,
	locationId: zp.id,
	userId: zp.id,
	status: ShiftStatusEnum,
	openedAt: z.string().datetime(),
	closedAt: z.string().datetime().nullable(),
	openingCash: zp.str,
	closingCash: zp.str.nullable(),
	expectedCash: zp.str.nullable(),
	notes: zp.str.nullable(),
})
export type ShiftDto = z.infer<typeof ShiftDto>

export const ShiftDetailDto = z.object({
	...ShiftDto.shape,
	orderCount: zp.num,
	totalRevenue: zp.str,
})
export type ShiftDetailDto = z.infer<typeof ShiftDetailDto>

// ─── Shift Filter ───

export const ShiftFilterDto = z.object({
	...zq.pagination.shape,
	locationId: z.coerce.number().int().positive(),
	status: ShiftStatusEnum.optional(),
})
export type ShiftFilterDto = z.infer<typeof ShiftFilterDto>

// ─── Shift Open / Close ───

export const ShiftOpenDto = z.object({
	locationId: z.coerce.number().int().positive(),
	openingCash: z.coerce.number().nonnegative(),
})
export type ShiftOpenDto = z.infer<typeof ShiftOpenDto>

export const ShiftCloseDto = z.object({
	shiftId: z.coerce.number().int().positive(),
	closingCash: z.coerce.number().nonnegative(),
	notes: z.string().trim().max(1000).optional(),
})
export type ShiftCloseDto = z.infer<typeof ShiftCloseDto>

// ─── Order Enums ───

export const OrderStatusEnum = z.enum(['open', 'completed', 'voided'])
export type OrderStatusEnum = z.infer<typeof OrderStatusEnum>

export const OrderTypeEnum = z.enum(['dine_in', 'takeaway'])
export type OrderTypeEnum = z.infer<typeof OrderTypeEnum>

export const ORDER_TYPE_OPTIONS = [
	{ label: 'Dine In', value: 'dine_in' },
	{ label: 'Takeaway', value: 'takeaway' },
] as const

export const OrderLineStatusEnum = z.enum(['active', 'voided'])
export type OrderLineStatusEnum = z.infer<typeof OrderLineStatusEnum>

// ─── Order Response ───

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
	source: z.string(),
	externalRef: zp.str.nullable(),
	notes: zp.str.nullable(),
	orderedAt: z.string().datetime(),
	completedAt: z.string().datetime().nullable(),
	...zc.AuditBasic.shape,
})
export type OrderDto = z.infer<typeof OrderDto>

// ─── Order Line Response ───

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

// ─── Order Payment Response ───

export const OrderPaymentRecordDto = z.object({
	id: zp.id,
	orderId: zp.id,
	paymentMethodId: zp.id,
	amount: zp.str,
	reference: zp.str.nullable(),
	createdAt: z.string().datetime(),
})
export type OrderPaymentRecordDto = z.infer<typeof OrderPaymentRecordDto>

// ─── Order Detail (with lines + payments) ───

export const OrderDetailDto = z.object({
	...OrderDto.shape,
	lines: z.array(OrderLineDto),
	payments: z.array(OrderPaymentRecordDto),
})
export type OrderDetailDto = z.infer<typeof OrderDetailDto>

// ─── Order Create Input ───

export const OrderCreateDto = z.object({
	locationId: z.coerce.number().int().positive(),
	tableId: z.coerce.number().int().positive().nullable().optional(),
	type: OrderTypeEnum,
	notes: z.string().trim().max(1000).nullable().optional(),
})
export type OrderCreateDto = z.infer<typeof OrderCreateDto>

// ─── Order Line Input ───

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

// ─── Order Voucher Input ───

export const OrderApplyVoucherDto = z.object({
	orderId: z.coerce.number().int().positive(),
	voucherCode: zc.strTrim.max(50),
})
export type OrderApplyVoucherDto = z.infer<typeof OrderApplyVoucherDto>

export const OrderRemoveVoucherDto = z.object({
	orderId: z.coerce.number().int().positive(),
})
export type OrderRemoveVoucherDto = z.infer<typeof OrderRemoveVoucherDto>

// ─── Order Payment Input ───

export const OrderPaymentInputDto = z.object({
	orderId: z.coerce.number().int().positive(),
	paymentMethodId: z.coerce.number().int().positive(),
	amount: z.coerce.number().positive(),
	reference: z.string().trim().max(255).nullable().optional(),
})
export type OrderPaymentInputDto = z.infer<typeof OrderPaymentInputDto>

// ─── Order Complete / Void Input ───

export const OrderCompleteDto = z.object({
	orderId: z.coerce.number().int().positive(),
})
export type OrderCompleteDto = z.infer<typeof OrderCompleteDto>

export const OrderVoidDto = z.object({
	orderId: z.coerce.number().int().positive(),
	reason: zc.strTrim.min(3).max(500),
})
export type OrderVoidDto = z.infer<typeof OrderVoidDto>

// ─── Order Filter ───

export const OrderFilterDto = z.object({
	...zq.pagination.shape,
	locationId: z.coerce.number().int().positive(),
	status: OrderStatusEnum.optional(),
	shiftId: z.coerce.number().int().positive().optional(),
	q: zq.search,
})
export type OrderFilterDto = z.infer<typeof OrderFilterDto>

// ─── Order Voucher Apply Result ───

export const OrderVoucherApplyResultDto = z.object({
	applied: zp.bool,
	reason: zp.str.optional(),
	discountAmount: zp.num.optional(),
})
export type OrderVoucherApplyResultDto = z.infer<typeof OrderVoucherApplyResultDto>

// ─── Voucher Enums ───

export const VoucherTypeEnum = z.enum(['percentage', 'fixed'])
export type VoucherTypeEnum = z.infer<typeof VoucherTypeEnum>

export const VOUCHER_TYPE_OPTIONS = [
	{ label: 'Percentage (%)', value: 'percentage' },
	{ label: 'Fixed (Rp)', value: 'fixed' },
] as const

// ─── Voucher Response ───

export const VoucherDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	type: VoucherTypeEnum,
	value: zp.str,
	minPurchase: zp.str.nullable(),
	maxDiscount: zp.str.nullable(),
	validFrom: zp.str,
	validUntil: zp.str,
	usageLimit: z.number().int().nullable(),
	usageCount: z.number().int(),
	isActive: zp.bool,
	...zc.AuditBasic.shape,
})
export type VoucherDto = z.infer<typeof VoucherDto>

// ─── Voucher Filter ───

export const VoucherFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	type: VoucherTypeEnum.optional(),
	isActive: z.coerce.boolean().optional(),
})
export type VoucherFilterDto = z.infer<typeof VoucherFilterDto>

// ─── Voucher Mutation (shared shape) ───

const VoucherMutationShape = {
	code: zc.strTrim.max(50),
	name: zc.strTrim.min(3).max(255),
	type: VoucherTypeEnum,
	value: z.coerce.number().positive(),
	minPurchase: z.coerce.number().nonnegative().nullable().optional(),
	maxDiscount: z.coerce.number().positive().nullable().optional(),
	validFrom: z.coerce.date(),
	validUntil: z.coerce.date(),
	usageLimit: z.coerce.number().int().positive().nullable().optional(),
	isActive: zp.bool.optional().default(true),
}

// ─── Voucher Create ───

export const VoucherCreateDto = z
	.object(VoucherMutationShape)
	.refine((d) => d.validFrom < d.validUntil, {
		message: 'Must be after Valid From',
		path: ['validUntil'],
	})
	.refine((d) => d.type !== 'percentage' || d.value <= 100, {
		message: 'Percentage cannot exceed 100',
		path: ['value'],
	})
export type VoucherCreateDto = z.infer<typeof VoucherCreateDto>

// ─── Voucher Update ───

export const VoucherUpdateDto = z
	.object({ id: zp.id, ...VoucherMutationShape })
	.refine((d) => d.validFrom < d.validUntil, {
		message: 'Must be after Valid From',
		path: ['validUntil'],
	})
	.refine((d) => d.type !== 'percentage' || d.value <= 100, {
		message: 'Percentage cannot exceed 100',
		path: ['value'],
	})
export type VoucherUpdateDto = z.infer<typeof VoucherUpdateDto>

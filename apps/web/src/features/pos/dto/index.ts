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

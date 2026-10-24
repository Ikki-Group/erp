import { z } from 'zod'

import { zp, zq } from '@/shared/schema/index.ts'

// ─── Enums ───

export const ShiftStatusEnum = z.enum(['open', 'closed'])
export type ShiftStatusEnum = z.infer<typeof ShiftStatusEnum>

// ─── Response ───

export const ShiftDto = z.object({
	id: zp.id,
	locationId: zp.id,
	userId: zp.id,
	status: ShiftStatusEnum,
	openedAt: zp.datetime,
	closedAt: zp.datetime.nullable(),
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

// ─── Input: Open ───

export const ShiftOpenDto = z.object({
	locationId: z.coerce.number().int().positive(),
	openingCash: z.coerce.number().nonnegative(),
})
export type ShiftOpenDto = z.infer<typeof ShiftOpenDto>

// ─── Input: Close ───

export const ShiftCloseDto = z.object({
	shiftId: z.coerce.number().int().positive(),
	closingCash: z.coerce.number().nonnegative(),
	notes: z.string().trim().max(1000).optional(),
})
export type ShiftCloseDto = z.infer<typeof ShiftCloseDto>

// ─── Filter ───

export const ShiftFilterDto = z.object({
	...zq.pagination.shape,
	locationId: z.coerce.number().int().positive(),
	status: ShiftStatusEnum.optional(),
})
export type ShiftFilterDto = z.infer<typeof ShiftFilterDto>

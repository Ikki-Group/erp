import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema/index.ts'

// ─── Enums ───

export const ReceivingStatusEnum = z.enum(['draft', 'confirmed'])
export type ReceivingStatusEnum = z.infer<typeof ReceivingStatusEnum>

// ─── Response: Receiving ───

export const ReceivingDto = z.object({
	id: zp.id,
	receivingNo: zp.str,
	locationId: zp.id,
	supplierId: zp.id,
	status: ReceivingStatusEnum,
	notes: zp.str.nullable(),
	receivedBy: zp.num.nullable(),
	...zc.AuditBasic.shape,
})
export type ReceivingDto = z.infer<typeof ReceivingDto>

// ─── Response: Receiving Line ───

export const ReceivingLineDto = z.object({
	id: zp.id,
	receivingId: zp.id,
	materialId: zp.id,
	quantity: zp.str,
	unitCost: zp.str,
	uomId: zp.id,
})
export type ReceivingLineDto = z.infer<typeof ReceivingLineDto>

// ─── Response: Receiving Detail (with lines) ───

export const ReceivingDetailDto = z.object({
	...ReceivingDto.shape,
	lines: z.array(ReceivingLineDto),
})
export type ReceivingDetailDto = z.infer<typeof ReceivingDetailDto>

// ─── Input: Line ───

const ReceivingLineInputDto = z.object({
	materialId: z.number().int().positive(),
	qty: z.string().regex(/^\d+(\.\d+)?$/u, 'Must be a positive number'),
	unitCost: z.string().regex(/^\d+(\.\d+)?$/u, 'Must be a positive number or zero'),
	uomId: z.number().int().positive(),
})

// ─── Input: Create ───

export const ReceivingCreateDto = z.object({
	locationId: z.number().int().positive(),
	supplierId: z.number().int().positive(),
	notes: zc.strTrimNullable.optional(),
	lines: z.array(ReceivingLineInputDto).min(1),
})
export type ReceivingCreateDto = z.infer<typeof ReceivingCreateDto>

// ─── Input: Update ───

export const ReceivingUpdateDto = z.object({
	receivingId: z.number().int().positive(),
	supplierId: z.number().int().positive().optional(),
	notes: zc.strTrimNullable.optional(),
	lines: z.array(ReceivingLineInputDto).min(1).optional(),
})
export type ReceivingUpdateDto = z.infer<typeof ReceivingUpdateDto>

// ─── Input: Confirm ───

export const ReceivingConfirmDto = z.object({
	receivingId: z.number().int().positive(),
})
export type ReceivingConfirmDto = z.infer<typeof ReceivingConfirmDto>

// ─── Filter: List ───

export const ReceivingFilterDto = z.object({
	...zq.pagination.shape,
	locationId: z.coerce.number().int().positive().optional(),
	supplierId: z.coerce.number().int().positive().optional(),
	status: ReceivingStatusEnum.optional(),
})
export type ReceivingFilterDto = z.infer<typeof ReceivingFilterDto>

// ─── Query: Detail ───

export const ReceivingDetailQueryDto = z.object({
	id: z.coerce.number().int().positive(),
})
export type ReceivingDetailQueryDto = z.infer<typeof ReceivingDetailQueryDto>

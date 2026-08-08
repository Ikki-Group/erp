import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema/index.ts'

// ─── Enums ───

export const TransferStatusEnum = z.enum(['requested', 'in_transit', 'received', 'cancelled'])
export type TransferStatusEnum = z.infer<typeof TransferStatusEnum>

// ─── Response: Transfer ───

export const TransferDto = z.object({
	id: zp.id,
	transferNo: zp.str,
	fromLocationId: zp.id,
	toLocationId: zp.id,
	status: TransferStatusEnum,
	notes: zp.str.nullable(),
	requestedBy: zp.num.nullable(),
	...zc.AuditBasic.shape,
})
export type TransferDto = z.infer<typeof TransferDto>

// ─── Response: Transfer Line ───

export const TransferLineDto = z.object({
	id: zp.id,
	transferId: zp.id,
	materialId: zp.id,
	requestedQty: zp.str,
	shippedQty: zp.str.nullable(),
	receivedQty: zp.str.nullable(),
	uomId: zp.id,
})
export type TransferLineDto = z.infer<typeof TransferLineDto>

// ─── Response: Transfer Detail (with lines) ───

export const TransferDetailDto = z.object({
	...TransferDto.shape,
	lines: z.array(TransferLineDto),
})
export type TransferDetailDto = z.infer<typeof TransferDetailDto>

// ─── Input: Create ───

const TransferLineInputDto = z.object({
	materialId: z.number().int().positive(),
	qty: z.string().regex(/^\d+(\.\d+)?$/u, 'Must be a positive number'),
	uomId: z.number().int().positive(),
})

export const TransferCreateDto = z.object({
	fromLocationId: z.number().int().positive(),
	toLocationId: z.number().int().positive(),
	notes: zc.strTrimNullable.optional(),
	lines: z.array(TransferLineInputDto).min(1),
})
export type TransferCreateDto = z.infer<typeof TransferCreateDto>

// ─── Input: Ship ───

export const TransferShipDto = z.object({
	transferId: z.number().int().positive(),
})
export type TransferShipDto = z.infer<typeof TransferShipDto>

// ─── Input: Receive ───

const TransferReceiveLineDto = z.object({
	materialId: z.number().int().positive(),
	receivedQty: z.string().regex(/^\d+(\.\d+)?$/u, 'Must be a positive number'),
})

export const TransferReceiveDto = z.object({
	transferId: z.number().int().positive(),
	lines: z.array(TransferReceiveLineDto).min(1),
})
export type TransferReceiveDto = z.infer<typeof TransferReceiveDto>

// ─── Filter: List ───

export const TransferFilterDto = z.object({
	...zq.pagination.shape,
	locationId: z.coerce.number().int().positive().optional(),
	status: TransferStatusEnum.optional(),
})
export type TransferFilterDto = z.infer<typeof TransferFilterDto>

// ─── Query: Detail ───

export const TransferDetailQueryDto = z.object({
	id: z.coerce.number().int().positive(),
})
export type TransferDetailQueryDto = z.infer<typeof TransferDetailQueryDto>

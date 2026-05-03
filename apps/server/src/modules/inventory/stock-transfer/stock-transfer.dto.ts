import { z } from 'zod'

import { zc, zp, zq } from '@/lib/validation'

/* ---------------------------------- ENUM ---------------------------------- */

export const TransferStatusEnum = z.enum([
	'pending_approval',
	'approved',
	'rejected',
	'in_transit',
	'completed',
	'cancelled',
])
export type TransferStatus = z.infer<typeof TransferStatusEnum>

/* ---------------------------------- ITEM ---------------------------------- */

export const StockTransferItemDto = z.object({
	...zc.RecordId.shape,
	transferId: zp.id,
	materialId: zp.id,
	itemName: zp.str,
	quantity: zp.decimal,
	unitCost: zp.decimal,
	totalCost: zp.decimal,
	notes: zp.strNullable,
	...zc.AuditBasic.shape,
})
export type StockTransferItemDto = z.infer<typeof StockTransferItemDto>

/* -------------------------------- ENTITY --------------------------------- */

export const StockTransferDto = z.object({
	...zc.RecordId.shape,
	sourceLocationId: zp.id,
	destinationLocationId: zp.id,
	status: TransferStatusEnum,
	transferDate: zp.date,
	expectedDate: zp.date.nullable().optional(),
	receivedDate: zp.date.nullable().optional(),
	referenceNo: zp.str,
	notes: zp.strNullable,
	rejectionReason: zp.strNullable,
	items: z.array(StockTransferItemDto),
	...zc.AuditBasic.shape,
})
export type StockTransferDto = z.infer<typeof StockTransferDto>

export const StockTransferSelectDto = StockTransferDto.omit({ items: true })
export type StockTransferSelectDto = z.infer<typeof StockTransferSelectDto>

/* -------------------------------- MUTATION -------------------------------- */

const StockTransferItemMutationDto = z.object({
	materialId: zp.id,
	itemName: zc.strTrim.min(1).max(255),
	quantity: zp.decimal.refine((v) => Number(v) > 0, 'Must be greater than 0'),
	unitCost: zp.decimal.refine((v) => Number(v) >= 0, 'Must be non-negative'),
	totalCost: zp.decimal,
	notes: zc.strTrimNullable,
})

const StockTransferMutationDto = z.object({
	sourceLocationId: zp.id,
	destinationLocationId: zp.id,
	status: TransferStatusEnum.default('pending_approval'),
	transferDate: zp.date.default(() => new Date()),
	expectedDate: zp.date.nullable().optional(),
	referenceNo: zc.strTrim.min(3).max(50),
	notes: zc.strTrimNullable,
	items: z.array(StockTransferItemMutationDto).min(1),
})

export const StockTransferCreateDto = StockTransferMutationDto
export type StockTransferCreateDto = z.infer<typeof StockTransferCreateDto>

export const StockTransferUpdateDto = StockTransferMutationDto.extend({
	...zc.RecordId.shape,
})
export type StockTransferUpdateDto = z.infer<typeof StockTransferUpdateDto>

/* -------------------------------- APPROVAL -------------------------------- */

export const StockTransferApproveDto = z.object({
	id: zp.id,
	notes: zc.strTrim.min(5).max(500).optional().or(z.literal('')),
})
export type StockTransferApproveDto = z.infer<typeof StockTransferApproveDto>

export const StockTransferRejectDto = z.object({
	id: zp.id,
	reason: zc.strTrim.min(5).max(500),
})
export type StockTransferRejectDto = z.infer<typeof StockTransferRejectDto>

export const StockTransferSubmitForApprovalDto = z.object({
	id: zp.id,
})
export type StockTransferSubmitForApprovalDto = z.infer<typeof StockTransferSubmitForApprovalDto>

export const StockTransferMarkInTransitDto = z.object({
	id: zp.id,
})
export type StockTransferMarkInTransitDto = z.infer<typeof StockTransferMarkInTransitDto>

export const StockTransferMarkCompletedDto = z.object({
	id: zp.id,
})
export type StockTransferMarkCompletedDto = z.infer<typeof StockTransferMarkCompletedDto>

export const StockTransferCancelDto = z.object({
	id: zp.id,
	reason: zc.strTrim.min(5).max(500),
})
export type StockTransferCancelDto = z.infer<typeof StockTransferCancelDto>

/* --------------------------------- FILTER --------------------------------- */

export const StockTransferFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	sourceLocationId: zq.id.optional(),
	destinationLocationId: zq.id.optional(),
	status: TransferStatusEnum.optional(),
	dateFrom: z.coerce.date().optional(),
	dateTo: z.coerce.date().optional(),
})
export type StockTransferFilterDto = z.infer<typeof StockTransferFilterDto>

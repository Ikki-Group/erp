import { z } from 'zod'

import { zc, zp, zq } from '@/lib/validation/index.ts'

// ─── Enums ───

export const MovementTypeEnum = z.enum([
	'receiving',
	'transfer_in',
	'transfer_out',
	'production_in',
	'production_out',
	'sale',
	'adjustment_in',
	'adjustment_out',
	'opname',
])
export type MovementTypeEnum = z.infer<typeof MovementTypeEnum>

export const MovementDirectionEnum = z.enum(['in', 'out'])
export type MovementDirectionEnum = z.infer<typeof MovementDirectionEnum>

export const MOVEMENT_TYPE_LABELS: Record<MovementTypeEnum, string> = {
	receiving: 'Penerimaan',
	transfer_in: 'Transfer Masuk',
	transfer_out: 'Transfer Keluar',
	production_in: 'Produksi Masuk',
	production_out: 'Produksi Keluar',
	sale: 'Penjualan',
	adjustment_in: 'Penyesuaian Masuk',
	adjustment_out: 'Penyesuaian Keluar',
	opname: 'Stock Opname',
}

// ─── Response: Balance ───

export const StockBalanceDto = z.object({
	id: zp.id,
	materialId: zp.id,
	materialCode: zp.str,
	materialName: zp.str,
	locationId: zp.id,
	quantity: zp.decimal,
	costPrice: zp.decimal,
	uomCode: zp.str,
	minStock: zp.decimal.nullable(),
})
export type StockBalanceDto = z.infer<typeof StockBalanceDto>

// ─── Response: Movement ───

export const StockMovementDto = z.object({
	id: zp.id,
	materialId: zp.id,
	locationId: zp.id,
	type: zp.str,
	direction: MovementDirectionEnum,
	quantity: zp.decimal,
	costPrice: zp.decimal,
	referenceType: zp.str.nullable(),
	referenceId: zp.num.nullable(),
	notes: zp.str.nullable(),
	createdAt: zp.date,
	createdBy: zp.num.nullable(),
})
export type StockMovementDto = z.infer<typeof StockMovementDto>

// ─── Filter: Balance List ───

export const StockBalanceFilterDto = z.object({
	...zq.pagination.shape,
	locationId: z.coerce.number().int().positive(),
	materialId: z.coerce.number().int().positive().optional(),
})
export type StockBalanceFilterDto = z.infer<typeof StockBalanceFilterDto>

// ─── Filter: Movement List ───

export const StockMovementFilterDto = z.object({
	...zq.pagination.shape,
	materialId: z.coerce.number().int().positive(),
	locationId: z.coerce.number().int().positive(),
	type: MovementTypeEnum.optional(),
	direction: MovementDirectionEnum.optional(),
})
export type StockMovementFilterDto = z.infer<typeof StockMovementFilterDto>

// ─── Transfer Enums ───

export const TransferStatusEnum = z.enum(['requested', 'in_transit', 'received', 'cancelled'])
export type TransferStatusEnum = z.infer<typeof TransferStatusEnum>

export const TRANSFER_STATUS_LABELS: Record<TransferStatusEnum, string> = {
	requested: 'Diajukan',
	in_transit: 'Dalam Perjalanan',
	received: 'Diterima',
	cancelled: 'Dibatalkan',
}

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

// ─── Response: Transfer Detail ───

export const TransferDetailDto = z.object({
	...TransferDto.shape,
	lines: z.array(TransferLineDto),
})
export type TransferDetailDto = z.infer<typeof TransferDetailDto>

// ─── Input: Create Transfer ───

const TransferLineInputDto = z.object({
	materialId: z.number().int().positive(),
	qty: z.string().regex(/^\d+(\.\d+)?$/u, 'Must be a positive number'),
	uomId: z.number().int().positive(),
})

export const TransferCreateDto = z.object({
	fromLocationId: z.number().int().positive(),
	toLocationId: z.number().int().positive(),
	notes: z.string().trim().nullable().optional(),
	lines: z.array(TransferLineInputDto).min(1),
})
export type TransferCreateDto = z.infer<typeof TransferCreateDto>

// ─── Input: Ship Transfer ───

export const TransferShipDto = z.object({
	transferId: z.number().int().positive(),
})
export type TransferShipDto = z.infer<typeof TransferShipDto>

// ─── Input: Receive Transfer ───

const TransferReceiveLineDto = z.object({
	materialId: z.number().int().positive(),
	receivedQty: z.string().regex(/^\d+(\.\d+)?$/u, 'Must be a positive number'),
})

export const TransferReceiveDto = z.object({
	transferId: z.number().int().positive(),
	lines: z.array(TransferReceiveLineDto).min(1),
})
export type TransferReceiveDto = z.infer<typeof TransferReceiveDto>

// ─── Filter: Transfer List ───

export const TransferFilterDto = z.object({
	...zq.pagination.shape,
	locationId: z.coerce.number().int().positive().optional(),
	status: TransferStatusEnum.optional(),
})
export type TransferFilterDto = z.infer<typeof TransferFilterDto>

// ─── Opname Enums ───

export const OpnameStatusEnum = z.enum(['draft', 'in_progress', 'completed', 'cancelled'])
export type OpnameStatusEnum = z.infer<typeof OpnameStatusEnum>

export const OPNAME_STATUS_LABELS: Record<OpnameStatusEnum, string> = {
	draft: 'Draft',
	in_progress: 'Sedang Berjalan',
	completed: 'Selesai',
	cancelled: 'Dibatalkan',
}

// ─── Response: Opname Line ───

export const OpnameLineDto = z.object({
	id: zp.id,
	opnameId: zp.id,
	materialId: zp.id,
	materialCode: zp.str,
	materialName: zp.str,
	systemQty: zp.str,
	actualQty: zp.str,
	reason: zp.str.nullable(),
})
export type OpnameLineDto = z.infer<typeof OpnameLineDto>

// ─── Response: Opname ───

export const OpnameDto = z.object({
	id: zp.id,
	opnameNo: zp.str,
	locationId: zp.id,
	status: OpnameStatusEnum,
	startedAt: zp.dateNullable,
	completedAt: zp.dateNullable,
	conductedBy: zp.num.nullable(),
	...zc.AuditBasic.shape,
})
export type OpnameDto = z.infer<typeof OpnameDto>

// ─── Response: Opname Detail ───

export const OpnameDetailDto = z.object({
	...OpnameDto.shape,
	lines: z.array(OpnameLineDto),
})
export type OpnameDetailDto = z.infer<typeof OpnameDetailDto>

// ─── Input: Create Opname ───

export const OpnameCreateDto = z.object({
	locationId: z.number().int().positive(),
	notes: zc.strTrimNullable.optional(),
})
export type OpnameCreateDto = z.infer<typeof OpnameCreateDto>

// ─── Input: Update Counts ───

const OpnameCountLineDto = z.object({
	materialId: z.number().int().positive(),
	countedQty: z.string().regex(/^\d+(\.\d+)?$/u, 'Must be a non-negative number'),
	reason: zc.strTrimNullable.optional(),
})

export const OpnameUpdateCountsDto = z.object({
	opnameId: z.number().int().positive(),
	lines: z.array(OpnameCountLineDto).min(1),
})
export type OpnameUpdateCountsDto = z.infer<typeof OpnameUpdateCountsDto>

// ─── Input: Approve Opname ───

export const OpnameApproveDto = z.object({
	opnameId: z.number().int().positive(),
})
export type OpnameApproveDto = z.infer<typeof OpnameApproveDto>

// ─── Filter: Opname List ───

export const OpnameFilterDto = z.object({
	...zq.pagination.shape,
	locationId: z.coerce.number().int().positive().optional(),
	status: OpnameStatusEnum.optional(),
})
export type OpnameFilterDto = z.infer<typeof OpnameFilterDto>

// ─── Receiving Enums ───

export const ReceivingStatusEnum = z.enum(['draft', 'confirmed'])
export type ReceivingStatusEnum = z.infer<typeof ReceivingStatusEnum>

export const RECEIVING_STATUS_LABELS: Record<ReceivingStatusEnum, string> = {
	draft: 'Draft',
	confirmed: 'Dikonfirmasi',
}

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

// ─── Response: Receiving Detail ───

export const ReceivingDetailDto = z.object({
	...ReceivingDto.shape,
	lines: z.array(ReceivingLineDto),
})
export type ReceivingDetailDto = z.infer<typeof ReceivingDetailDto>

// ─── Input: Receiving Line ───

const ReceivingLineInputDto = z.object({
	materialId: z.number().int().positive(),
	qty: z.string().regex(/^\d+(\.\d+)?$/u, 'Must be a positive number'),
	unitCost: z.string().regex(/^\d+(\.\d+)?$/u, 'Must be a positive number or zero'),
	uomId: z.number().int().positive(),
})

// ─── Input: Create Receiving ───

export const ReceivingCreateDto = z.object({
	locationId: z.number().int().positive(),
	supplierId: z.number().int().positive(),
	notes: zc.strTrimNullable.optional(),
	lines: z.array(ReceivingLineInputDto).min(1),
})
export type ReceivingCreateDto = z.infer<typeof ReceivingCreateDto>

// ─── Input: Confirm Receiving ───

export const ReceivingConfirmDto = z.object({
	receivingId: z.number().int().positive(),
})
export type ReceivingConfirmDto = z.infer<typeof ReceivingConfirmDto>

// ─── Filter: Receiving List ───

export const ReceivingFilterDto = z.object({
	...zq.pagination.shape,
	locationId: z.coerce.number().int().positive().optional(),
	supplierId: z.coerce.number().int().positive().optional(),
	status: ReceivingStatusEnum.optional(),
})
export type ReceivingFilterDto = z.infer<typeof ReceivingFilterDto>

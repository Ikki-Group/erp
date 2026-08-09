import { z } from 'zod'

import { zp, zq } from '@/lib/validation/index.ts'

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

import { z } from 'zod'

import { zp, zq } from '@/shared/schema/index.ts'

// ─── Enums ───

export const MovementTypeEnum = z.enum([
	'purchase_receipt',
	'transfer_in',
	'transfer_out',
	'production_in',
	'production_out',
	'sales',
	'adjustment_in',
	'adjustment_out',
	'return_in',
])
export type MovementTypeEnum = z.infer<typeof MovementTypeEnum>

export const MovementDirectionEnum = z.enum(['in', 'out'])
export type MovementDirectionEnum = z.infer<typeof MovementDirectionEnum>

// ─── Response: Balance ───

export const StockBalanceDto = z.object({
	id: zp.id,
	materialId: zp.id,
	materialCode: zp.str,
	materialName: zp.str,
	locationId: zp.id,
	quantity: zp.str,
	costPrice: zp.str,
	uomCode: zp.str,
	minStock: zp.str.nullable(),
})
export type StockBalanceDto = z.infer<typeof StockBalanceDto>

// ─── Response: Movement ───

export const StockMovementDto = z.object({
	id: zp.id,
	materialId: zp.id,
	locationId: zp.id,
	type: zp.str,
	direction: MovementDirectionEnum,
	quantity: zp.str,
	costPrice: zp.str,
	referenceType: zp.str.nullable(),
	referenceId: zp.num.nullable(),
	notes: zp.str.nullable(),
	createdAt: zp.datetime,
	createdBy: zp.num.nullable(),
})
export type StockMovementDto = z.infer<typeof StockMovementDto>

// ─── Query: Single Balance ───

export const StockBalanceQueryDto = z.object({
	materialId: z.coerce.number().int().positive(),
	locationId: z.coerce.number().int().positive(),
})
export type StockBalanceQueryDto = z.infer<typeof StockBalanceQueryDto>

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

/** Same filters as `StockMovementFilterDto`, keyset-paginated by `(createdAt desc, id desc)`. */
export const StockMovementCursorFilterDto = StockMovementFilterDto.omit({ page: true }).extend(
	zq.cursorPagination.shape,
)
export type StockMovementCursorFilterDto = z.infer<typeof StockMovementCursorFilterDto>

// ─── Internal Input (not Zod — used by other modules via service) ───

export interface RecordMovementInput {
	materialId: number
	locationId: number
	type: MovementTypeEnum
	direction: MovementDirectionEnum
	qty: string
	unitCost?: string
	referenceType?: string
	referenceId?: number
	notes?: string
	actorId: number
}

/** Identifies one stock_balances row; the unit of row locking for movements. */
export interface BalanceKey {
	materialId: number
	locationId: number
}

/**
 * Canonical lock order for balance rows: (locationId, materialId) ascending.
 * Every transaction that touches several balances MUST lock them in this order.
 */
export function compareBalanceKeys(a: BalanceKey, b: BalanceKey): number {
	return a.locationId - b.locationId || a.materialId - b.materialId
}

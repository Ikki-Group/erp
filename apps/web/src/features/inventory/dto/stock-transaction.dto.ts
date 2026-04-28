import z from 'zod'

import { zp, zc, zq } from '@/lib/validation'

/* ---------------------------------- ENUM ---------------------------------- */

export const TransactionTypeDto = z.enum([
	'purchase',
	'transfer_in',
	'transfer_out',
	'adjustment',
	'sell',
	'usage',
	'production_in',
	'production_out',
])
export type TransactionTypeDto = z.infer<typeof TransactionTypeDto>

/* --------------------------------- ENTITY --------------------------------- */

export const StockTransactionDto = z.object({
	...zc.RecordId.shape,
	materialId: zp.id,
	locationId: zp.id,

	type: TransactionTypeDto,
	date: zp.date,
	referenceNo: zp.str,
	notes: zp.strNullable,

	// Quantity & Cost
	qty: zp.num,
	unitCost: zp.num,
	totalCost: zp.num,

	// Transfer-specific
	counterpartLocationId: zp.id.nullable().default(null),
	transferId: z.number().nullable().default(null),

	// Running snapshot after this transaction
	runningQty: zp.num,
	runningAvgCost: zp.num,
	...zc.AuditFull.shape,
})

export type StockTransactionDto = z.infer<typeof StockTransactionDto>

/* --------------------------------- RESULT --------------------------------- */

/** Transaction enriched with material info for display */
export const StockTransactionSelectDto = StockTransactionDto.extend({
	materialName: zp.str,
	materialSku: zp.str,
})

export type StockTransactionSelectDto = z.infer<typeof StockTransactionSelectDto>

/* --------------------------------- FILTER --------------------------------- */

export const StockTransactionFilterDto = z.object({
	locationId: zq.id.optional(),
	materialId: zq.id.optional(),
	type: TransactionTypeDto.optional(),
	q: zq.search,
	dateFrom: z.coerce.date().optional(),
	dateTo: z.coerce.date().optional(),
})

export type StockTransactionFilterDto = z.infer<typeof StockTransactionFilterDto>

/* ─────────────────── MUTATION: NESTED ITEMS ──────────────────── */

/** Single item within a purchase transaction */
export const PurchaseItemDto = z.object({
	materialId: zp.id,
	qty: zp.num.positive('Quantity must be positive'),
	unitCost: zp.num.nonnegative('Unit cost must be non-negative'),
})

/** Single item within a transfer transaction */
export const TransferItemDto = z.object({
	materialId: zp.id,
	qty: zp.num.positive('Quantity must be positive'),
})

/** Single item within an adjustment transaction */
export const AdjustmentItemDto = z.object({
	materialId: zp.id,
	qty: zp.num.refine((v) => v !== 0, 'Quantity must not be zero'),
	unitCost: zp.num.nonnegative().optional(),
})

/** Single item within a stock out (usage/sell) transaction */
export const UsageItemDto = z.object({
	materialId: zp.id,
	qty: zp.num.positive('Quantity must be positive'),
})

/* ──────────────────── MUTATION: BATCH OPS ────────────────────── */

/** Create purchase transactions (multiple materials at one location) */
export const PurchaseTransactionDto = z.object({
	locationId: zp.id,
	date: zp.date,
	referenceNo: zp.str,
	notes: zp.strNullable.optional(),
	items: PurchaseItemDto.array().min(1, 'At least one item is required'),
})

export type PurchaseTransactionDto = z.infer<typeof PurchaseTransactionDto>

/** Create transfer transactions (multiple materials between two locations) */
export const TransferTransactionDto = z.object({
	sourceLocationId: zp.id,
	destinationLocationId: zp.id,
	date: zp.date,
	referenceNo: zp.str,
	notes: zp.strNullable.optional(),
	items: TransferItemDto.array().min(1, 'At least one item is required'),
})

export type TransferTransactionDto = z.infer<typeof TransferTransactionDto>

/** Create adjustment transactions (multiple materials at one location) */
export const AdjustmentTransactionDto = z.object({
	locationId: zp.id,
	date: zp.date,
	referenceNo: zp.str,
	notes: zp.strNullable.optional(),
	items: AdjustmentItemDto.array().min(1, 'At least one item is required'),
})

export type AdjustmentTransactionDto = z.infer<typeof AdjustmentTransactionDto>

/** Create usage transactions (multiple materials at one location) */
export const UsageTransactionDto = z.object({
	locationId: zp.id,
	date: zp.date,
	referenceNo: zp.str,
	notes: zp.strNullable.optional(),
	items: UsageItemDto.array().min(1, 'At least one item is required'),
})

export type UsageTransactionDto = z.infer<typeof UsageTransactionDto>

/** Create sales transactions (multiple materials at one location) */
export const SellTransactionDto = z.object({
	locationId: zp.id,
	date: zp.date,
	referenceNo: zp.str,
	notes: zp.strNullable.optional(),
	items: UsageItemDto.array().min(1, 'At least one item is required'),
})

export type SellTransactionDto = z.infer<typeof SellTransactionDto>

/** Production In transactions (finished goods) */
export const ProductionInTransactionDto = z.object({
	locationId: zp.id,
	date: zp.date,
	referenceNo: zp.str,
	notes: zp.strNullable.optional(),
	items: PurchaseItemDto.array().min(1, 'At least one item is required'),
})

export type ProductionInTransactionDto = z.infer<typeof ProductionInTransactionDto>

/** Production Out transactions (material consumption) */
export const ProductionOutTransactionDto = z.object({
	locationId: zp.id,
	date: zp.date,
	referenceNo: zp.str,
	notes: zp.strNullable.optional(),
	items: UsageItemDto.array().min(1, 'At least one item is required'),
})

export type ProductionOutTransactionDto = z.infer<typeof ProductionOutTransactionDto>

/* ────────────────── MUTATION: RESULT SCHEMA ──────────────────── */

/** Response for batch transaction operations */
export const TransactionResultDto = z.object({ count: z.number(), referenceNo: zp.str })

export type TransactionResultDto = z.infer<typeof TransactionResultDto>

import {
	zDate,
	zId,
	zMetadataDto,
	zNum,
	zQueryId,
	zQuerySearch,
	zRecordIdDto,
	zStr,
	zStrNullable,
} from '@/lib/zod'

import z from 'zod'

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
	...zRecordIdDto.shape,
	materialId: zId,
	locationId: zId,

	type: TransactionTypeDto,
	date: zDate,
	referenceNo: zStr,
	notes: zStrNullable,

	// Quantity & Cost
	qty: zNum,
	unitCost: zNum,
	totalCost: zNum,

	// Transfer-specific
	counterpartLocationId: zId.nullable().default(null),
	transferId: z.number().nullable().default(null),

	// Running snapshot after this transaction
	runningQty: zNum,
	runningAvgCost: zNum,
	...zMetadataDto.shape,
})

export type StockTransactionDto = z.infer<typeof StockTransactionDto>

/* --------------------------------- RESULT --------------------------------- */

/** Transaction enriched with material info for display */
export const StockTransactionSelectDto = StockTransactionDto.extend({
	materialName: zStr,
	materialSku: zStr,
})

export type StockTransactionSelectDto = z.infer<typeof StockTransactionSelectDto>

/* --------------------------------- FILTER --------------------------------- */

export const StockTransactionFilterDto = z.object({
	locationId: zQueryId.optional(),
	materialId: zQueryId.optional(),
	type: TransactionTypeDto.optional(),
	q: zQuerySearch,
	dateFrom: z.coerce.date().optional(),
	dateTo: z.coerce.date().optional(),
})

export type StockTransactionFilterDto = z.infer<typeof StockTransactionFilterDto>

/* ─────────────────── MUTATION: NESTED ITEMS ──────────────────── */

/** Single item within a purchase transaction */
export const PurchaseItemDto = z.object({
	materialId: zId,
	qty: zNum.positive('Quantity must be positive'),
	unitCost: zNum.nonnegative('Unit cost must be non-negative'),
})

/** Single item within a transfer transaction */
export const TransferItemDto = z.object({
	materialId: zId,
	qty: zNum.positive('Quantity must be positive'),
})

/** Single item within an adjustment transaction */
export const AdjustmentItemDto = z.object({
	materialId: zId,
	qty: zNum.refine((v) => v !== 0, 'Quantity must not be zero'),
	unitCost: zNum.nonnegative().optional(),
})

/** Single item within a stock out (usage/sell) transaction */
export const UsageItemDto = z.object({
	materialId: zId,
	qty: zNum.positive('Quantity must be positive'),
})

/* ──────────────────── MUTATION: BATCH OPS ────────────────────── */

/** Create purchase transactions (multiple materials at one location) */
export const PurchaseTransactionDto = z.object({
	locationId: zId,
	date: zDate,
	referenceNo: zStr,
	notes: zStrNullable.optional(),
	items: PurchaseItemDto.array().min(1, 'At least one item is required'),
})

export type PurchaseTransactionDto = z.infer<typeof PurchaseTransactionDto>

/** Create transfer transactions (multiple materials between two locations) */
export const TransferTransactionDto = z.object({
	sourceLocationId: zId,
	destinationLocationId: zId,
	date: zDate,
	referenceNo: zStr,
	notes: zStrNullable.optional(),
	items: TransferItemDto.array().min(1, 'At least one item is required'),
})

export type TransferTransactionDto = z.infer<typeof TransferTransactionDto>

/** Create adjustment transactions (multiple materials at one location) */
export const AdjustmentTransactionDto = z.object({
	locationId: zId,
	date: zDate,
	referenceNo: zStr,
	notes: zStrNullable.optional(),
	items: AdjustmentItemDto.array().min(1, 'At least one item is required'),
})

export type AdjustmentTransactionDto = z.infer<typeof AdjustmentTransactionDto>

/** Create usage transactions (multiple materials at one location) */
export const UsageTransactionDto = z.object({
	locationId: zId,
	date: zDate,
	referenceNo: zStr,
	notes: zStrNullable.optional(),
	items: UsageItemDto.array().min(1, 'At least one item is required'),
})

export type UsageTransactionDto = z.infer<typeof UsageTransactionDto>

/** Create sales transactions (multiple materials at one location) */
export const SellTransactionDto = z.object({
	locationId: zId,
	date: zDate,
	referenceNo: zStr,
	notes: zStrNullable.optional(),
	items: UsageItemDto.array().min(1, 'At least one item is required'),
})

export type SellTransactionDto = z.infer<typeof SellTransactionDto>

/** Production In transactions (finished goods) */
export const ProductionInTransactionDto = z.object({
	locationId: zId,
	date: zDate,
	referenceNo: zStr,
	notes: zStrNullable.optional(),
	items: PurchaseItemDto.array().min(1, 'At least one item is required'),
})

export type ProductionInTransactionDto = z.infer<typeof ProductionInTransactionDto>

/** Production Out transactions (material consumption) */
export const ProductionOutTransactionDto = z.object({
	locationId: zId,
	date: zDate,
	referenceNo: zStr,
	notes: zStrNullable.optional(),
	items: UsageItemDto.array().min(1, 'At least one item is required'),
})

export type ProductionOutTransactionDto = z.infer<typeof ProductionOutTransactionDto>

/* ────────────────── MUTATION: RESULT SCHEMA ──────────────────── */

/** Response for batch transaction operations */
export const TransactionResultDto = z.object({ count: z.number(), referenceNo: zStr })

export type TransactionResultDto = z.infer<typeof TransactionResultDto>

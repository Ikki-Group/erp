import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

/* ---------------------------------- ENUM ---------------------------------- */

export const TransactionTypeEnum = z.enum([
	'purchase',
	'transfer_in',
	'transfer_out',
	'adjustment',
	'sell',
	'usage',
	'production_in',
	'production_out',
])
export type TransactionType = z.infer<typeof TransactionTypeEnum>

/* --------------------------------- ENTITY --------------------------------- */

export const StockTransactionDto = z.object({
	...zc.RecordId.shape,
	materialId: zp.id,
	locationId: zp.id,
	type: TransactionTypeEnum,
	date: zp.date,
	referenceNo: zp.str,
	notes: zp.strNullable,

	// Quantity & Cost
	qty: zp.decimal,
	unitCost: zp.decimal,
	totalCost: zp.decimal,

	// Transfer-specific
	counterpartLocationId: zp.id.nullable().default(null),
	transferId: zp.num.nullable().default(null),

	// Running snapshot after this transaction
	runningQty: zp.decimal,
	runningAvgCost: zp.decimal,
	...zc.AuditBasic.shape,
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
	...zq.pagination.shape,
	locationId: zq.id.optional(),
	materialId: zq.id.optional(),
	type: TransactionTypeEnum.optional(),
	search: zq.search,
	dateFrom: z.coerce.date().optional(),
	dateTo: z.coerce.date().optional(),
})

export type StockTransactionFilterDto = z.infer<typeof StockTransactionFilterDto>

/* ─────────────────── MUTATION: NESTED ITEMS ──────────────────── */

/** Single item within a purchase transaction */
const PurchaseItemDto = z.object({
	materialId: zp.id,
	qty: zp.decimal.refine((v) => Number(v) > 0, 'Quantity must be positive'),
	unitCost: zp.decimal.refine((v) => Number(v) >= 0, 'Unit cost must be non-negative'),
})

/** Single item within a transfer transaction */
const TransferItemDto = z.object({
	materialId: zp.id,
	qty: zp.decimal.refine((v) => Number(v) > 0, 'Quantity must be positive'),
})

/** Single item within an adjustment transaction */
const AdjustmentItemDto = z.object({
	materialId: zp.id,
	qty: zp.decimal.refine((v) => Number(v) !== 0, 'Quantity must not be zero'),
	unitCost: zp.decimal.refine((v) => Number(v) >= 0, 'Must be non-negative').optional(),
})

/** Single item within a stock out (usage/sell) transaction */
const UsageItemDto = z.object({
	materialId: zp.id,
	qty: zp.decimal.refine((v) => Number(v) > 0, 'Quantity must be positive'),
})

/* ──────────────────── MUTATION: BATCH OPS ────────────────────── */

const BaseBatchMutationDto = z.object({
	date: zp.date,
	referenceNo: zc.strTrim.min(3).max(50),
	notes: zc.strTrimNullable,
})

/** Create purchase transactions (multiple materials at one location) */
export const PurchaseTransactionDto = BaseBatchMutationDto.extend({
	locationId: zp.id,
	items: z.array(PurchaseItemDto).min(1, 'At least one item is required'),
})
export type PurchaseTransactionDto = z.infer<typeof PurchaseTransactionDto>

/** Create transfer transactions (multiple materials between two locations) */
export const TransferTransactionDto = BaseBatchMutationDto.extend({
	sourceLocationId: zp.id,
	destinationLocationId: zp.id,
	items: z.array(TransferItemDto).min(1, 'At least one item is required'),
})
export type TransferTransactionDto = z.infer<typeof TransferTransactionDto>

/** Create adjustment transactions (multiple materials at one location) */
export const AdjustmentTransactionDto = BaseBatchMutationDto.extend({
	locationId: zp.id,
	items: z.array(AdjustmentItemDto).min(1, 'At least one item is required'),
})
export type AdjustmentTransactionDto = z.infer<typeof AdjustmentTransactionDto>

/** Create usage transactions (multiple materials at one location) */
export const UsageTransactionDto = BaseBatchMutationDto.extend({
	locationId: zp.id,
	items: z.array(UsageItemDto).min(1, 'At least one item is required'),
})
export type UsageTransactionDto = z.infer<typeof UsageTransactionDto>

/** Create sales transactions (multiple materials at one location) */
export const SellTransactionDto = BaseBatchMutationDto.extend({
	locationId: zp.id,
	items: z.array(UsageItemDto).min(1, 'At least one item is required'),
})
export type SellTransactionDto = z.infer<typeof SellTransactionDto>

/** Production In transactions (finished goods) */
export const ProductionInTransactionDto = BaseBatchMutationDto.extend({
	locationId: zp.id,
	items: z.array(PurchaseItemDto).min(1, 'At least one item is required'),
})
export type ProductionInTransactionDto = z.infer<typeof ProductionInTransactionDto>

/** Production Out transactions (material consumption) */
export const ProductionOutTransactionDto = BaseBatchMutationDto.extend({
	locationId: zp.id,
	items: z.array(UsageItemDto).min(1, 'At least one item is required'),
})
export type ProductionOutTransactionDto = z.infer<typeof ProductionOutTransactionDto>

/* ────────────────── MUTATION: RESULT SCHEMA ──────────────────── */

/** Response for batch transaction operations */
export const TransactionResultDto = z.object({
	count: zp.num,
	referenceNo: zp.str,
})
export type TransactionResultDto = z.infer<typeof TransactionResultDto>

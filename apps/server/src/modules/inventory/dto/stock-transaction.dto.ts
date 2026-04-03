import z from 'zod'

import { zStrNullable, zStr, zNum, zId, zDate, zQuerySearch, zQueryId, zMetadataDto, zRecordIdDto } from '@/core/validation'

/* ---------------------------------- ENUM ---------------------------------- */

export const transactionTypeSchema = z.enum(['purchase', 'transfer_in', 'transfer_out', 'adjustment', 'sell', 'usage', 'production_in', 'production_out'])
export type TransactionType = z.infer<typeof transactionTypeSchema>

/* --------------------------------- ENTITY --------------------------------- */

export const stockTransactionSchema = z.object({
  ...zRecordIdDto.shape,
  materialId: zId,
  locationId: zId,

  type: transactionTypeSchema,
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

export type StockTransactionDto = z.infer<typeof stockTransactionSchema>

/* --------------------------------- RESULT --------------------------------- */

/** Transaction enriched with material info for display */
export const stockTransactionSelectSchema = stockTransactionSchema.extend({
  materialName: zStr,
  materialSku: zStr,
})

export type StockTransactionSelectDto = z.infer<typeof stockTransactionSelectSchema>

/* --------------------------------- FILTER --------------------------------- */

export const stockTransactionFilterSchema = z.object({
  locationId: zQueryId.optional(),
  materialId: zQueryId.optional(),
  type: transactionTypeSchema.optional(),
  search: zQuerySearch,
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})

export type StockTransactionFilterDto = z.infer<typeof stockTransactionFilterSchema>

/* ─────────────────── MUTATION: NESTED ITEMS ──────────────────── */

/** Single item within a purchase transaction */
export const purchaseItemSchema = z.object({
  materialId: zId,
  qty: zNum.positive('Quantity must be positive'),
  unitCost: zNum.nonnegative('Unit cost must be non-negative'),
})

/** Single item within a transfer transaction */
export const transferItemSchema = z.object({
  materialId: zId,
  qty: zNum.positive('Quantity must be positive'),
})

/** Single item within an adjustment transaction */
export const adjustmentItemSchema = z.object({
  materialId: zId,
  qty: zNum.refine((v) => v !== 0, 'Quantity must not be zero'),
  unitCost: zNum.nonnegative().optional(),
})

/** Single item within a stock out (usage/sell) transaction */
export const usageItemSchema = z.object({
  materialId: zId,
  qty: zNum.positive('Quantity must be positive'),
})

/* ──────────────────── MUTATION: BATCH OPS ────────────────────── */

/** Create purchase transactions (multiple materials at one location) */
export const purchaseTransactionSchema = z.object({
  locationId: zId,
  date: zDate,
  referenceNo: zStr,
  notes: zStrNullable.optional(),
  items: purchaseItemSchema.array().min(1, 'At least one item is required'),
})

export type PurchaseTransactionDto = z.infer<typeof purchaseTransactionSchema>

/** Create transfer transactions (multiple materials between two locations) */
export const transferTransactionSchema = z.object({
  sourceLocationId: zId,
  destinationLocationId: zId,
  date: zDate,
  referenceNo: zStr,
  notes: zStrNullable.optional(),
  items: transferItemSchema.array().min(1, 'At least one item is required'),
})

export type TransferTransactionDto = z.infer<typeof transferTransactionSchema>

/** Create adjustment transactions (multiple materials at one location) */
export const adjustmentTransactionSchema = z.object({
  locationId: zId,
  date: zDate,
  referenceNo: zStr,
  notes: zStrNullable.optional(),
  items: adjustmentItemSchema.array().min(1, 'At least one item is required'),
})

export type AdjustmentTransactionDto = z.infer<typeof adjustmentTransactionSchema>

/** Create usage transactions (multiple materials at one location) */
export const usageTransactionSchema = z.object({
  locationId: zId,
  date: zDate,
  referenceNo: zStr,
  notes: zStrNullable.optional(),
  items: usageItemSchema.array().min(1, 'At least one item is required'),
})

export type UsageTransactionDto = z.infer<typeof usageTransactionSchema>

/** Create sales transactions (multiple materials at one location) */
export const sellTransactionSchema = z.object({
  locationId: zId,
  date: zDate,
  referenceNo: zStr,
  notes: zStrNullable.optional(),
  items: usageItemSchema.array().min(1, 'At least one item is required'),
})

export type SellTransactionDto = z.infer<typeof sellTransactionSchema>

/** Production In transactions (finished goods) */
export const productionInTransactionSchema = z.object({
  locationId: zId,
  date: zDate,
  referenceNo: zStr,
  notes: zStrNullable.optional(),
  items: purchaseItemSchema.array().min(1, 'At least one item is required'),
})

export type ProductionInTransactionDto = z.infer<typeof productionInTransactionSchema>

/** Production Out transactions (material consumption) */
export const productionOutTransactionSchema = z.object({
  locationId: zId,
  date: zDate,
  referenceNo: zStr,
  notes: zStrNullable.optional(),
  items: usageItemSchema.array().min(1, 'At least one item is required'),
})

export type ProductionOutTransactionDto = z.infer<typeof productionOutTransactionSchema>

/* ────────────────── MUTATION: RESULT SCHEMA ──────────────────── */

/** Response for batch transaction operations */
export const transactionResultSchema = z.object({ count: z.number(), referenceNo: zStr })

export type TransactionResultDto = z.infer<typeof transactionResultSchema>

import z from 'zod'

import { zStrNullable, zStr, zNum, zId, zDate, zQuerySearch, zQueryId, zMetadataDto } from '@/lib/zod'

/* ---------------------------------- ENUM ---------------------------------- */

export const TransactionType = z.enum(['purchase', 'transfer_in', 'transfer_out', 'adjustment', 'sell'])
export type TransactionType = z.infer<typeof TransactionType>

/* --------------------------------- ENTITY --------------------------------- */

export const StockTransactionDto = z.object({
  id: zId,
  materialId: zId,
  locationId: zId,

  type: TransactionType,
  date: zDate,
  referenceNo: zStr,
  notes: zStrNullable,

  // Quantity & Cost
  qty: zNum,
  unitCost: zNum,
  totalCost: zNum,

  // Transfer-specific
  counterpartLocationId: zId.nullable().default(null),
  transferId: zStrNullable.default(null),

  // Running snapshot after this transaction
  runningQty: zNum,
  runningAvgCost: zNum,

  ...zMetadataDto.shape,
})

export type StockTransactionDto = z.infer<typeof StockTransactionDto>

/* --------------------------------- OUTPUT --------------------------------- */

/** Transaction enriched with material info for display */
export const StockTransactionOutputDto = z.object({
  ...StockTransactionDto.shape,
  materialName: zStr,
  materialSku: zStr,
})

export type StockTransactionOutputDto = z.infer<typeof StockTransactionOutputDto>

/* --------------------------------- FILTER --------------------------------- */

export const StockTransactionFilterDto = z.object({
  locationId: zQueryId.optional(),
  materialId: zQueryId.optional(),
  type: TransactionType.optional(),
  search: zQuerySearch,
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

/* ────────────────── MUTATION: RESULT SCHEMA ──────────────────── */

/** Response for batch transaction operations */
export const TransactionResultDto = z.object({ count: z.number(), referenceNo: zStr })

export type TransactionResultDto = z.infer<typeof TransactionResultDto>

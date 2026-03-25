import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/zod'

/* ---------------------------------- ENUM ---------------------------------- */

export const TransactionType = z.enum(['purchase', 'transfer_in', 'transfer_out', 'adjustment', 'sell'])
export type TransactionType = z.infer<typeof TransactionType>

/* --------------------------------- ENTITY --------------------------------- */

export const StockTransactionDto = z.object({
  id: zPrimitive.id,
  materialId: zPrimitive.id,
  locationId: zPrimitive.id,

  type: TransactionType,
  date: zPrimitive.date,
  referenceNo: zPrimitive.str,
  notes: zPrimitive.strNullable,

  // Quantity & Cost
  qty: zPrimitive.num,
  unitCost: zPrimitive.num,
  totalCost: zPrimitive.num,

  // Transfer-specific
  counterpartLocationId: zPrimitive.id.nullable().default(null),
  transferId: zPrimitive.strNullable.default(null),

  // Running snapshot after this transaction
  runningQty: zPrimitive.num,
  runningAvgCost: zPrimitive.num,

  ...zSchema.metadata.shape,
})

export type StockTransactionDto = z.infer<typeof StockTransactionDto>

/* --------------------------------- OUTPUT --------------------------------- */

/** Transaction enriched with material info for display */
export const StockTransactionOutputDto = z.object({
  ...StockTransactionDto.shape,
  materialName: zPrimitive.str,
  materialSku: zPrimitive.str,
})

export type StockTransactionOutputDto = z.infer<typeof StockTransactionOutputDto>

/* --------------------------------- FILTER --------------------------------- */

export const StockTransactionFilterDto = z.object({
  locationId: zHttp.query.id.optional(),
  materialId: zHttp.query.id.optional(),
  type: TransactionType.optional(),
  search: zHttp.query.search,
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})

export type StockTransactionFilterDto = z.infer<typeof StockTransactionFilterDto>

/* ─────────────────── MUTATION: NESTED ITEMS ──────────────────── */

/** Single item within a purchase transaction */
export const PurchaseItemDto = z.object({
  materialId: zPrimitive.id,
  qty: zPrimitive.num.positive('Quantity must be positive'),
  unitCost: zPrimitive.num.nonnegative('Unit cost must be non-negative'),
})

/** Single item within a transfer transaction */
export const TransferItemDto = z.object({
  materialId: zPrimitive.id,
  qty: zPrimitive.num.positive('Quantity must be positive'),
})

/** Single item within an adjustment transaction */
export const AdjustmentItemDto = z.object({
  materialId: zPrimitive.id,
  qty: zPrimitive.num.refine((v) => v !== 0, 'Quantity must not be zero'),
  unitCost: zPrimitive.num.nonnegative().optional(),
})

/* ──────────────────── MUTATION: BATCH OPS ────────────────────── */

/** Create purchase transactions (multiple materials at one location) */
export const PurchaseTransactionDto = z.object({
  locationId: zPrimitive.id,
  date: zPrimitive.date,
  referenceNo: zPrimitive.str,
  notes: zPrimitive.strNullable.optional(),
  items: PurchaseItemDto.array().min(1, 'At least one item is required'),
})

export type PurchaseTransactionDto = z.infer<typeof PurchaseTransactionDto>

/** Create transfer transactions (multiple materials between two locations) */
export const TransferTransactionDto = z.object({
  sourceLocationId: zPrimitive.id,
  destinationLocationId: zPrimitive.id,
  date: zPrimitive.date,
  referenceNo: zPrimitive.str,
  notes: zPrimitive.strNullable.optional(),
  items: TransferItemDto.array().min(1, 'At least one item is required'),
})

export type TransferTransactionDto = z.infer<typeof TransferTransactionDto>

/** Create adjustment transactions (multiple materials at one location) */
export const AdjustmentTransactionDto = z.object({
  locationId: zPrimitive.id,
  date: zPrimitive.date,
  referenceNo: zPrimitive.str,
  notes: zPrimitive.strNullable.optional(),
  items: AdjustmentItemDto.array().min(1, 'At least one item is required'),
})

export type AdjustmentTransactionDto = z.infer<typeof AdjustmentTransactionDto>

/* ────────────────── MUTATION: RESULT SCHEMA ──────────────────── */

/** Response for batch transaction operations */
export const TransactionResultDto = z.object({ count: z.number(), referenceNo: zPrimitive.str })

export type TransactionResultDto = z.infer<typeof TransactionResultDto>

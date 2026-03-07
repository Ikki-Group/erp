import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

const StockSummaryDto = z.object({
  id: zPrimitive.id,
  materialId: zPrimitive.id,
  locationId: zPrimitive.id,
  date: zPrimitive.date,

  // Opening balance
  openingQty: zPrimitive.num,
  openingAvgCost: zPrimitive.num,
  openingValue: zPrimitive.num,

  // Movements
  purchaseQty: zPrimitive.num,
  purchaseValue: zPrimitive.num,
  transferInQty: zPrimitive.num,
  transferInValue: zPrimitive.num,
  transferOutQty: zPrimitive.num,
  transferOutValue: zPrimitive.num,
  adjustmentQty: zPrimitive.num,
  adjustmentValue: zPrimitive.num,
  sellQty: zPrimitive.num,
  sellValue: zPrimitive.num,

  // Closing balance
  closingQty: zPrimitive.num,
  closingAvgCost: zPrimitive.num,
  closingValue: zPrimitive.num,

  ...zSchema.metadata.shape,
})

type StockSummaryDto = z.infer<typeof StockSummaryDto>

/* --------------------------------- SELECT --------------------------------- */

/** Summary enriched with material info for display */
export const StockSummarySelectDto = z.object({
  ...StockSummaryDto.shape,
  materialName: zPrimitive.str,
  materialSku: zPrimitive.str,
})

export type StockSummarySelectDto = z.infer<typeof StockSummarySelectDto>

/* --------------------------------- FILTER --------------------------------- */

export const StockSummaryFilterDto = z.object({
  locationId: zHttp.query.id,
  materialId: zHttp.query.id.optional(),
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
})

export type StockSummaryFilterDto = z.infer<typeof StockSummaryFilterDto>

export const StockLedgerFilterDto = z.object({
  locationId: zHttp.query.id.optional(),
  materialId: zHttp.query.id.optional(),
  search: zHttp.query.search,
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
})

export type StockLedgerFilterDto = z.infer<typeof StockLedgerFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

/** Generate daily summary for a specific date + location */
export const GenerateSummaryDto = z.object({
  locationId: zPrimitive.id,
  date: zPrimitive.date,
})

export type GenerateSummaryDto = z.infer<typeof GenerateSummaryDto>

/* --------------------------------- LEDGER --------------------------------- */

export const StockLedgerSelectDto = z.object({
  materialId: zPrimitive.id,
  materialName: zPrimitive.str,
  materialSku: zPrimitive.str,
  baseUomCode: zPrimitive.str,

  openingQty: zPrimitive.num,

  purchaseQty: zPrimitive.num,
  transferInQty: zPrimitive.num,
  transferOutQty: zPrimitive.num,
  sellQty: zPrimitive.num,
  adjustmentQty: zPrimitive.num,

  closingQty: zPrimitive.num,
  closingValue: zPrimitive.num,
  closingAvgCost: zPrimitive.num,
})

export type StockLedgerSelectDto = z.infer<typeof StockLedgerSelectDto>

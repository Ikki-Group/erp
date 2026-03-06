import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const StockSummaryDto = z.object({
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

export type StockSummaryDto = z.infer<typeof StockSummaryDto>

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

/* -------------------------------- MUTATION -------------------------------- */

/** Generate daily summary for a specific date + location */
export const GenerateSummaryDto = z.object({
  locationId: zPrimitive.id,
  date: zPrimitive.date,
})

export type GenerateSummaryDto = z.infer<typeof GenerateSummaryDto>

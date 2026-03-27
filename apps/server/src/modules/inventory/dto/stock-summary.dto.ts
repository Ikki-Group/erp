import z from 'zod'

import { zStr, zNum, zId, zDate, zQuerySearch, zQueryId, zMetadataDto } from '@/core/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const stockSummarySchema = z
  .object({
    id: zId,
    materialId: zId,
    locationId: zId,
    date: zDate,

    // Opening balance
    openingQty: zNum,
    openingAvgCost: zNum,
    openingValue: zNum,

    // Movements
    purchaseQty: zNum,
    purchaseValue: zNum,
    transferInQty: zNum,
    transferInValue: zNum,
    transferOutQty: zNum,
    transferOutValue: zNum,
    adjustmentQty: zNum,
    adjustmentValue: zNum,
    sellQty: zNum,
    sellValue: zNum,

    // Closing balance
    closingQty: zNum,
    closingAvgCost: zNum,
    closingValue: zNum,
  })
  .merge(zMetadataDto)

export type StockSummaryDto = z.infer<typeof stockSummarySchema>

/* --------------------------------- RESULT --------------------------------- */

/** Summary enriched with material info for display */
export const stockSummarySelectSchema = stockSummarySchema.extend({
  materialName: zStr,
  materialSku: zStr,
})

export type StockSummarySelectDto = z.infer<typeof stockSummarySelectSchema>

/* --------------------------------- FILTER --------------------------------- */

export const stockSummaryFilterSchema = z.object({
  locationId: zQueryId,
  materialId: zQueryId.optional(),
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
})

export type StockSummaryFilterDto = z.infer<typeof stockSummaryFilterSchema>

export const stockLedgerFilterSchema = z.object({
  locationId: zQueryId.optional(),
  materialId: zQueryId.optional(),
  search: zQuerySearch,
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
})

export type StockLedgerFilterDto = z.infer<typeof stockLedgerFilterSchema>

/* -------------------------------- MUTATION -------------------------------- */

/** Generate daily summary for a specific date + location */
export const generateSummarySchema = z.object({ locationId: zId, date: zDate })

export type GenerateSummaryDto = z.infer<typeof generateSummarySchema>

/* --------------------------------- LEDGER --------------------------------- */

export const stockLedgerSelectSchema = z.object({
  materialId: zId,
  materialName: zStr,
  materialSku: zStr,
  baseUomCode: zStr,

  openingQty: zNum,

  purchaseQty: zNum,
  transferInQty: zNum,
  transferOutQty: zNum,
  sellQty: zNum,
  adjustmentQty: zNum,

  closingQty: zNum,
  closingValue: zNum,
  closingAvgCost: zNum,
})

export type StockLedgerSelectDto = z.infer<typeof stockLedgerSelectSchema>

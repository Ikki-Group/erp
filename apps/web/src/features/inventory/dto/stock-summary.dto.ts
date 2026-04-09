import z from 'zod'

import { zDate, zId, zMetadataDto, zNum, zQueryId, zQuerySearch, zRecordIdDto, zStr } from '@/lib/zod'

/* --------------------------------- ENTITY --------------------------------- */

export const StockSummaryDto = z.object({
  ...zRecordIdDto.shape,
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
  usageQty: zNum,
  usageValue: zNum,
  productionInQty: zNum,
  productionInValue: zNum,
  productionOutQty: zNum,
  productionOutValue: zNum,
  sellQty: zNum,
  sellValue: zNum,

  // Closing balance
  closingQty: zNum,
  closingAvgCost: zNum,
  closingValue: zNum,
  ...zMetadataDto.shape,
})

export type StockSummaryDto = z.infer<typeof StockSummaryDto>

/* --------------------------------- RESULT --------------------------------- */

/** Summary enriched with material info for display */
export const StockSummarySelectDto = StockSummaryDto.extend({ materialName: zStr, materialSku: zStr })

export type StockSummarySelectDto = z.infer<typeof StockSummarySelectDto>

/* --------------------------------- FILTER --------------------------------- */

export const StockSummaryFilterDto = z.object({
  locationId: zQueryId,
  materialId: zQueryId.optional(),
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
})

export type StockSummaryFilterDto = z.infer<typeof StockSummaryFilterDto>

export const StockLedgerFilterDto = z.object({
  locationId: zQueryId.optional(),
  materialId: zQueryId.optional(),
  q: zQuerySearch,
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
})

export type StockLedgerFilterDto = z.infer<typeof StockLedgerFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

/** Generate daily summary for a specific date + location */
export const GenerateSummaryDto = z.object({ locationId: zId, date: zDate })

export type GenerateSummaryDto = z.infer<typeof GenerateSummaryDto>

/* --------------------------------- LEDGER --------------------------------- */

export const StockLedgerSelectDto = z.object({
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
  usageQty: zNum,
  productionInQty: zNum,
  productionOutQty: zNum,

  closingQty: zNum,
  closingValue: zNum,
  closingAvgCost: zNum,
})

export type StockLedgerSelectDto = z.infer<typeof StockLedgerSelectDto>

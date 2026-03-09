import { z } from 'zod'
import { zHttp, zPrimitive } from '@/lib/zod'

export const StockLedgerFilterDto = z.object({
  locationId: zPrimitive.id.optional(),
  materialId: zPrimitive.id.optional(),
  search: zHttp.search,
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
})

export type StockLedgerFilterDto = z.infer<typeof StockLedgerFilterDto>

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

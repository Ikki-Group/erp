import { z } from 'zod'
import {
  AdjustmentTransactionDto,
  GenerateSummaryDto,
  PurchaseTransactionDto,
  StockLedgerFilterDto,
  StockLedgerOutputDto,
  StockSummaryFilterDto,
  StockSummaryOutputDto,
  StockTransactionDto,
  StockTransactionFilterDto,
  StockTransactionOutputDto,
  TransactionResultDto,
  TransferTransactionDto,
} from '../dto'
import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { zHttp, zSchema } from '@/lib/zod'

export const stockSummaryApi = {
  byLocation: apiFactory({
    method: 'get',
    url: endpoint.inventory.summary.byLocation,
    params: z.object({
      ...zHttp.pagination.shape,
      ...StockSummaryFilterDto.shape,
    }),
    result: zHttp.paginated(StockSummaryOutputDto.array()),
  }),
  ledger: apiFactory({
    method: 'get',
    url: endpoint.inventory.summary.ledger,
    params: z.object({
      ...zHttp.pagination.shape,
      ...StockLedgerFilterDto.shape,
    }),
    result: zHttp.paginated(StockLedgerOutputDto.array()),
  }),
  generate: apiFactory({
    method: 'post',
    url: endpoint.inventory.summary.generate,
    body: GenerateSummaryDto,
    result: zHttp.ok(z.object({ generatedCount: z.number() })),
  }),
}

export const stockTransactionApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.inventory.transaction.list,
    params: z.object({
      ...zHttp.pagination.shape,
      ...StockTransactionFilterDto.shape,
    }),
    result: zHttp.paginated(StockTransactionOutputDto.array()),
  }),
  detail: apiFactory({
    method: 'get',
    url: endpoint.inventory.transaction.detail,
    params: zSchema.recordId,
    result: zHttp.ok(StockTransactionDto),
  }),
  purchase: apiFactory({
    method: 'post',
    url: endpoint.inventory.transaction.purchase,
    body: PurchaseTransactionDto,
    result: zHttp.ok(TransactionResultDto),
  }),
  transfer: apiFactory({
    method: 'post',
    url: endpoint.inventory.transaction.transfer,
    body: TransferTransactionDto,
    result: zHttp.ok(TransactionResultDto),
  }),
  adjustment: apiFactory({
    method: 'post',
    url: endpoint.inventory.transaction.adjustment,
    body: AdjustmentTransactionDto,
    result: zHttp.ok(TransactionResultDto),
  }),
}

// Keep inventoryApi for backward compatibility
export const inventoryApi = stockSummaryApi

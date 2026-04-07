import { z } from 'zod'

import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import {
  createPaginatedResponseSchema,
  createSuccessResponseSchema,
  zPaginationDto,
  zRecordIdDto,
} from '@/lib/zod'

import {
  AdjustmentTransactionDto,
  GenerateSummaryDto,
  PurchaseTransactionDto,
  StockLedgerFilterDto,
  StockLedgerSelectDto,
  StockSummaryFilterDto,
  StockSummarySelectDto,
  StockTransactionDto,
  StockTransactionFilterDto,
  StockTransactionSelectDto,
  TransactionResultDto,
  TransferTransactionDto,
} from '../dto'

export const stockSummaryApi = {
  byLocation: apiFactory({
    method: 'get',
    url: endpoint.inventory.summary.byLocation,
    params: z.object({ ...zPaginationDto.shape, ...StockSummaryFilterDto.shape }),
    result: createPaginatedResponseSchema(StockSummarySelectDto),
  }),
  ledger: apiFactory({
    method: 'get',
    url: endpoint.inventory.summary.ledger,
    params: z.object({ ...zPaginationDto.shape, ...StockLedgerFilterDto.shape }),
    result: createPaginatedResponseSchema(StockLedgerSelectDto),
  }),
  generate: apiFactory({
    method: 'post',
    url: endpoint.inventory.summary.generate,
    body: GenerateSummaryDto,
    result: createSuccessResponseSchema(z.object({ count: z.number() })),
  }),
}

export const stockTransactionApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.inventory.transaction.list,
    params: z.object({ ...zPaginationDto.shape, ...StockTransactionFilterDto.shape }),
    result: createPaginatedResponseSchema(StockTransactionSelectDto),
  }),
  detail: apiFactory({
    method: 'get',
    url: endpoint.inventory.transaction.detail,
    params: zRecordIdDto,
    result: createSuccessResponseSchema(StockTransactionDto),
  }),
  purchase: apiFactory({
    method: 'post',
    url: endpoint.inventory.transaction.purchase,
    body: PurchaseTransactionDto,
    result: createSuccessResponseSchema(TransactionResultDto),
  }),
  transfer: apiFactory({
    method: 'post',
    url: endpoint.inventory.transaction.transfer,
    body: TransferTransactionDto,
    result: createSuccessResponseSchema(TransactionResultDto),
  }),
  adjustment: apiFactory({
    method: 'post',
    url: endpoint.inventory.transaction.adjustment,
    body: AdjustmentTransactionDto,
    result: createSuccessResponseSchema(TransactionResultDto),
  }),
  opname: apiFactory({
    method: 'post',
    url: endpoint.inventory.transaction.opname,
    body: StockOpnameDto,
    result: createSuccessResponseSchema(TransactionResultDto),
  }),
}

// Keep inventoryApi for backward compatibility
export const inventoryApi = stockSummaryApi

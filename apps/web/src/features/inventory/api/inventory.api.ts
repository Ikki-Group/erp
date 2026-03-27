import { z } from 'zod'

import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { zPaginationDto, zRecordIdDto, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/lib/zod'

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

export const stockSummaryApi = {
  byLocation: apiFactory({
    method: 'get',
    url: endpoint.inventory.summary.byLocation,
    params: z.object({ ...zPaginationDto.shape, ...StockSummaryFilterDto.shape }),
    result: createPaginatedResponseSchema(StockSummaryOutputDto.array()),
  }),
  ledger: apiFactory({
    method: 'get',
    url: endpoint.inventory.summary.ledger,
    params: z.object({ ...zPaginationDto.shape, ...StockLedgerFilterDto.shape }),
    result: createPaginatedResponseSchema(StockLedgerOutputDto.array()),
  }),
  generate: apiFactory({
    method: 'post',
    url: endpoint.inventory.summary.generate,
    body: GenerateSummaryDto,
    result: createSuccessResponseSchema(z.object({ generatedCount: z.number() })),
  }),
}

export const stockTransactionApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.inventory.transaction.list,
    params: z.object({ ...zPaginationDto.shape, ...StockTransactionFilterDto.shape }),
    result: createPaginatedResponseSchema(StockTransactionOutputDto.array()),
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
}

// Keep inventoryApi for backward compatibility
export const inventoryApi = stockSummaryApi

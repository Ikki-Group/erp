import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zPaginationSchema, zRecordIdSchema, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/core/validation'

import {
  AdjustmentTransactionDto,
  PurchaseTransactionDto,
  StockTransactionDto,
  StockTransactionFilterDto,
  StockTransactionSelectDto,
  TransactionResultDto,
  TransferTransactionDto,
} from '../dto'
import type { InventoryServiceModule } from '../service'

export function initStockTransactionRoute(s: InventoryServiceModule) {
  return (
    new Elysia({ prefix: '/transaction' })
      .use(authPluginMacro)

      /* ─────── Record purchases (multiple materials) ─────── */
      .post(
        '/purchase',
        async function purchase({ body, auth }) {
          const result = await s.transaction.handlePurchase(body, auth.userId)
          return res.ok(result)
        },
        {
          body: PurchaseTransactionDto,
          response: createSuccessResponseSchema(TransactionResultDto),
          auth: true,
          detail: { tags: ['Inventory Transaction'] },
        },
      )

      /* ─────── Transfer stock between locations (multiple materials) ─────── */
      .post(
        '/transfer',
        async function transfer({ body, auth }) {
          const result = await s.transaction.handleTransfer(body, auth.userId)
          return res.ok(result)
        },
        {
          body: TransferTransactionDto,
          response: createSuccessResponseSchema(TransactionResultDto),
          auth: true,
          detail: { tags: ['Inventory Transaction'] },
        },
      )

      /* ─────── Record stock adjustments (multiple materials) ─────── */
      .post(
        '/adjustment',
        async function adjustment({ body, auth }) {
          const result = await s.transaction.handleAdjustment(body, auth.userId)
          return res.ok(result)
        },
        {
          body: AdjustmentTransactionDto,
          response: createSuccessResponseSchema(TransactionResultDto),
          auth: true,
          detail: { tags: ['Inventory Transaction'] },
        },
      )

      /* ─────── List transactions (paginated) ─────── */
      .get(
        '/list',
        async function list({ query }) {
          const result = await s.transaction.handleList(query, query)
          return res.paginated(result)
        },
        {
          query: z.object({ ...zPaginationSchema.shape, ...StockTransactionFilterDto.shape }),
          response: createPaginatedResponseSchema(StockTransactionSelectDto.array()),
          auth: true,
          detail: { tags: ['Inventory Transaction'] },
        },
      )

      /* ─────── Get transaction detail ─────── */
      .get(
        '/detail',
        async function detail({ query }) {
          const data = await s.transaction.handleDetail(query.id)
          return res.ok(data)
        },
        {
          query: zRecordIdSchema,
          response: createSuccessResponseSchema(StockTransactionDto),
          auth: true,
          detail: { tags: ['Inventory Transaction'] },
        },
      )
  )
}

import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zPaginationDto, zRecordIdDto, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/core/validation'

import {
  adjustmentTransactionSchema,
  purchaseTransactionSchema,
  stockTransactionFilterSchema,
  stockTransactionSchema,
  stockTransactionSelectSchema,
  transactionResultSchema,
  transferTransactionSchema,
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
          body: purchaseTransactionSchema,
          response: createSuccessResponseSchema(transactionResultSchema),
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
          body: transferTransactionSchema,
          response: createSuccessResponseSchema(transactionResultSchema),
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
          body: adjustmentTransactionSchema,
          response: createSuccessResponseSchema(transactionResultSchema),
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
          query: stockTransactionFilterSchema.extend(zPaginationDto.shape),
          response: createPaginatedResponseSchema(stockTransactionSelectSchema.array()),
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
          query: zRecordIdDto,
          response: createSuccessResponseSchema(stockTransactionSchema),
          auth: true,
          detail: { tags: ['Inventory Transaction'] },
        },
      )

      /* ─────── Soft delete transaction ─────── */
      .post(
        '/remove',
        async function remove({ query, auth }) {
          await s.transaction.handleRemove(query.id, auth.userId)
          return res.ok({ id: query.id })
        },
        {
          query: zRecordIdDto,
          response: createSuccessResponseSchema(zRecordIdDto),
          auth: true,
          detail: { tags: ['Inventory Transaction'] },
        },
      )

      /* ─────── Hard delete transaction ─────── */
      .post(
        '/hard-remove',
        async function hardRemove({ query }) {
          await s.transaction.handleHardRemove(query.id)
          return res.ok({ id: query.id })
        },
        {
          query: zRecordIdDto,
          response: createSuccessResponseSchema(zRecordIdDto),
          auth: true,
          detail: { tags: ['Inventory Transaction'] },
        },
      )
  )
}

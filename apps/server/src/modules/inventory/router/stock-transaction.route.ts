import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
  zPaginationDto,
  zRecordIdDto,
  createSuccessResponseSchema,
  createPaginatedResponseSchema,
} from '@/core/validation'

import {
  adjustmentTransactionSchema,
  purchaseTransactionSchema,
  stockOpnameSchema,
  stockTransactionFilterSchema,
  stockTransactionSchema,
  stockTransactionSelectSchema,
  transactionResultSchema,
  transferTransactionSchema,
  usageTransactionSchema,
  sellTransactionSchema,
  productionInTransactionSchema,
  productionOutTransactionSchema,
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

      /* ─────── Record stock opname (single material) ─────── */
      .post(
        '/opname',
        async function opname({ body, auth }) {
          const result = await s.transaction.handleOpname(body, auth.userId)
          return res.ok(result)
        },
        {
          body: stockOpnameSchema,
          response: createSuccessResponseSchema(transactionResultSchema),
          auth: true,
          detail: { tags: ['Inventory Transaction'] },
        },
      )

      /* ─────── Record material usage (multiple materials) ─────── */
      .post(
        '/usage',
        async function usage({ body, auth }) {
          const result = await s.transaction.handleUsage(body, auth.userId)
          return res.ok(result)
        },
        {
          body: usageTransactionSchema,
          response: createSuccessResponseSchema(transactionResultSchema),
          auth: true,
          detail: { tags: ['Inventory Transaction'] },
        },
      )

      /* ─────── Record direct sell (multiple materials) ─────── */
      .post(
        '/sell',
        async function sell({ body, auth }) {
          const result = await s.transaction.handleSell(body, auth.userId)
          return res.ok(result)
        },
        {
          body: sellTransactionSchema,
          response: createSuccessResponseSchema(transactionResultSchema),
          auth: true,
          detail: { tags: ['Inventory Transaction'] },
        },
      )

      /* ─────── Record production input (multiple materials) ─────── */
      .post(
        '/production-in',
        async function productionIn({ body, auth }) {
          const result = await s.transaction.handleProductionIn(body, auth.userId)
          return res.ok(result)
        },
        {
          body: productionInTransactionSchema,
          response: createSuccessResponseSchema(transactionResultSchema),
          auth: true,
          detail: { tags: ['Inventory Transaction'] },
        },
      )

      /* ─────── Record production output/consume (multiple materials) ─────── */
      .post(
        '/production-out',
        async function productionOut({ body, auth }) {
          const result = await s.transaction.handleProductionOut(body, auth.userId)
          return res.ok(result)
        },
        {
          body: productionOutTransactionSchema,
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
          response: createPaginatedResponseSchema(stockTransactionSelectSchema),
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
  )
}

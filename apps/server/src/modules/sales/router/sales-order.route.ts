import { Elysia } from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/core/http/auth-plugin'
import { res } from '@/core/http/response'
import { zHttp, zResponse, zSchema } from '@/core/validation'

import {
  SalesOrderAddBatchDto,
  SalesOrderCreateDto,
  SalesOrderDto,
  SalesOrderFilterDto,
  SalesOrderOutputDto,
  SalesOrderVoidDto,
} from '../dto'
import type { SalesServiceModule } from '../service'

export function initSalesOrderRoute(s: SalesServiceModule) {
  return new Elysia({ prefix: '/order' })
    .use(authPluginMacro)

    .get(
      '/list',
      async ({ query }) => {
        const result = await s.order.handleList(query, query)
        return res.paginated(result)
      },
      {
        query: z
          .object({
            ...zHttp.pagination.shape,
            search: zHttp.query.search,
          })
          .merge(SalesOrderFilterDto),
        response: zResponse.paginated(SalesOrderDto.array()),
        auth: true,
      }
    )

    .get(
      '/detail',
      async ({ query }) => {
        const result = await s.order.handleDetail(query.id)
        return res.ok(result)
      },
      {
        query: zHttp.recordId,
        response: zResponse.ok(SalesOrderOutputDto),
        auth: true,
      }
    )

    .post(
      '/create',
      async ({ body, auth }) => {
        const result = await s.order.handleCreate(body, auth.userId)
        return res.created(result, 'SALES_ORDER_CREATED')
      },
      {
        body: SalesOrderCreateDto,
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )

    .post(
      '/add-batch',
      async ({ body, query, auth }) => {
        const result = await s.order.handleAddBatch(query.id, body, auth.userId)
        return res.ok(result, 'SALES_ORDER_BATCH_ADDED')
      },
      {
        query: zHttp.recordId,
        body: SalesOrderAddBatchDto,
        response: zResponse.ok(z.object({ batchId: z.number() })),
        auth: true,
      }
    )

    .post(
      '/close',
      async ({ query, auth }) => {
        const result = await s.order.handleClose(query.id, auth.userId)
        return res.ok(result, 'SALES_ORDER_CLOSED')
      },
      {
        query: zHttp.recordId,
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )

    .post(
      '/void',
      async ({ body, query, auth }) => {
        const result = await s.order.handleVoid(query.id, body, auth.userId)
        return res.ok(result, 'SALES_ORDER_VOIDED')
      },
      {
        query: zHttp.recordId,
        body: SalesOrderVoidDto,
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
}

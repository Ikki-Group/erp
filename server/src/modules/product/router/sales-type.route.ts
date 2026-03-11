import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-plugin'
import { res } from '@/core/http/response'
import { zHttp, zPrimitive, zResponse, zSchema } from '@/core/validation'

import { SalesTypeDto, SalesTypeFilterDto, SalesTypeMutationDto } from '../dto'
import type { ProductServiceModule } from '../service'

export function initSalesTypeRoute(s: ProductServiceModule) {
  return new Elysia({ prefix: '/sales-type' })
    .use(authPluginMacro)
    .get(
      '/list',
      async function list({ query }) {
        const result = await s.salesType.handleList(query, query)
        return res.paginated(result)
      },
      {
        query: z.object({
          ...zHttp.pagination.shape,
          ...SalesTypeFilterDto.shape,
        }),
        response: zResponse.paginated(SalesTypeDto.array()),
        auth: true,
      }
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const salesType = await s.salesType.handleDetail(query.id)
        return res.ok(salesType)
      },
      {
        query: zHttp.recordId,
        response: zResponse.ok(SalesTypeDto),
        auth: true,
      }
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const { id } = await s.salesType.handleCreate(body, auth.userId)
        return res.created({ id })
      },
      {
        body: SalesTypeMutationDto,
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const { id } = await s.salesType.handleUpdate(body.id, body, auth.userId)
        return res.ok({ id })
      },
      {
        body: z.object({
          id: zPrimitive.id,
          ...SalesTypeMutationDto.shape,
        }),
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
    .delete(
      '/remove',
      async function remove({ query }) {
        await s.salesType.handleRemove(query.id)
        return res.ok({ id: query.id })
      },
      {
        query: zHttp.recordId,
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
}

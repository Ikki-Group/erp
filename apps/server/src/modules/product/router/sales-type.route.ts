import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zId, zPaginationSchema, zRecordIdSchema, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/core/validation'

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
        query: z.object({ ...zPaginationSchema.shape, ...SalesTypeFilterDto.shape }),
        response: createPaginatedResponseSchema(SalesTypeDto.array()),
        auth: true,
      },
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const salesType = await s.salesType.handleDetail(query.id)
        return res.ok(salesType)
      },
      { query: zRecordIdSchema, response: createSuccessResponseSchema(SalesTypeDto), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const { id } = await s.salesType.handleCreate(body, auth.userId)
        return res.created({ id })
      },
      { body: SalesTypeMutationDto, response: createSuccessResponseSchema(zRecordIdSchema), auth: true },
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const { id } = await s.salesType.handleUpdate(body.id, body, auth.userId)
        return res.ok({ id })
      },
      {
        body: z.object({ id: zId, ...SalesTypeMutationDto.shape }),
        response: createSuccessResponseSchema(zRecordIdSchema),
        auth: true,
      },
    )
    .delete(
      '/remove',
      async function remove({ query }) {
        await s.salesType.handleRemove(query.id)
        return res.ok({ id: query.id })
      },
      { query: zRecordIdSchema, response: createSuccessResponseSchema(zRecordIdSchema), auth: true },
    )
}

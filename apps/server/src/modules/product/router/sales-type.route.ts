import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
  zPaginationDto,
  zRecordIdDto,
  createSuccessResponseSchema,
  createPaginatedResponseSchema,
} from '@/core/validation'

import { salesTypeSchema, salesTypeFilterSchema, salesTypeMutationSchema } from '../dto'
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
        query: salesTypeFilterSchema.extend(zPaginationDto.shape),
        response: createPaginatedResponseSchema(salesTypeSchema),
        auth: true,
      },
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const salesType = await s.salesType.handleDetail(query.id)
        return res.ok(salesType)
      },
      { query: zRecordIdDto, response: createSuccessResponseSchema(salesTypeSchema), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const { id } = await s.salesType.handleCreate(body, auth.userId)
        return res.created({ id })
      },
      { body: salesTypeMutationSchema, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .patch(
      '/update',
      async function update({ body, auth }) {
        const { id } = await s.salesType.handleUpdate(body.id, body, auth.userId)
        return res.ok({ id })
      },
      {
        body: salesTypeMutationSchema.extend(zRecordIdDto.shape),
        response: createSuccessResponseSchema(zRecordIdDto),
        auth: true,
      },
    )
    .delete(
      '/remove',
      async function remove({ query }) {
        await s.salesType.handleRemove(query.id)
        return res.ok({ id: query.id })
      },
      { query: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
}

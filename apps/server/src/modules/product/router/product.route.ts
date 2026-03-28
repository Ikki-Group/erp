import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zId, zPaginationDto, zRecordIdDto, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/core/validation'

import { productFilterSchema, productMutationSchema, productSelectSchema } from '../dto'
import type { ProductServiceModule } from '../service'

export function initProductRoute(s: ProductServiceModule) {
  return new Elysia()
    .use(authPluginMacro)
    .get(
      '/list',
      async function list({ query }) {
        const result = await s.product.handleList(query, query)
        return res.paginated(result)
      },
      {
        query: productFilterSchema.extend(zPaginationDto.shape),
        response: createPaginatedResponseSchema(productSelectSchema.array()),
        auth: true,
      },
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const product = await s.product.handleDetail(query.id)
        return res.ok(product)
      },
      { query: zRecordIdDto, response: createSuccessResponseSchema(productSelectSchema), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const { id } = await s.product.handleCreate(body, auth.userId)
        return res.created({ id })
      },
      { body: productMutationSchema, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const { id } = await s.product.handleUpdate(body.id, body, auth.userId)
        return res.ok({ id })
      },
      {
        body: productMutationSchema.extend({ id: zId }),
        response: createSuccessResponseSchema(zRecordIdDto),
        auth: true,
      },
    )
    .delete(
      '/remove',
      async function remove({ query, auth }) {
        await s.product.handleRemove(query.id, auth.userId)
        return res.ok({ id: query.id })
      },
      { query: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .delete(
      '/hard-remove',
      async function hardRemove({ query }) {
        await s.product.handleHardRemove(query.id)
        return res.ok({ id: query.id })
      },
      { query: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
}

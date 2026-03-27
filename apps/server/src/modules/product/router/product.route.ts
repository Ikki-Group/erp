import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zId, zPaginationSchema, zRecordIdSchema, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/core/validation'

import { ProductFilterDto, ProductMutationDto, ProductSelectDto } from '../dto'
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
        query: z.object({ ...zPaginationSchema.shape, ...ProductFilterDto.shape }),
        response: createPaginatedResponseSchema(ProductSelectDto.array()),
        auth: true,
      },
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const product = await s.product.handleDetail(query.id)
        return res.ok(product)
      },
      { query: zRecordIdSchema, response: createSuccessResponseSchema(ProductSelectDto), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const { id } = await s.product.handleCreate(body, auth.userId)
        return res.created({ id })
      },
      { body: ProductMutationDto, response: createSuccessResponseSchema(zRecordIdSchema), auth: true },
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const { id } = await s.product.handleUpdate(body.id, body, auth.userId)
        return res.ok({ id })
      },
      {
        body: z.object({ id: zId, ...ProductMutationDto.shape }),
        response: createSuccessResponseSchema(zRecordIdSchema),
        auth: true,
      },
    )
    .delete(
      '/remove',
      async function remove({ query }) {
        await s.product.handleRemove(query.id)
        return res.ok({ id: query.id })
      },
      { query: zRecordIdSchema, response: createSuccessResponseSchema(zRecordIdSchema), auth: true },
    )
}

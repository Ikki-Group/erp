import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zPaginationDto, zRecordIdDto, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/core/validation'

import { productCategoryFilterSchema, productCategoryMutationSchema, productCategorySchema } from '../dto'
import type { ProductServiceModule } from '../service'

export function initProductCategoryRoute(s: ProductServiceModule) {
  return new Elysia({ prefix: '/category' })
    .use(authPluginMacro)
    .get(
      '/list',
      async function list({ query }) {
        const result = await s.category.handleList(query, query)
        return res.paginated(result)
      },
      {
        query: productCategoryFilterSchema.extend(zPaginationDto.shape),
        response: createPaginatedResponseSchema(productCategorySchema),
        auth: true,
      },
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const category = await s.category.handleDetail(query.id)
        return res.ok(category)
      },
      { query: zRecordIdDto, response: createSuccessResponseSchema(productCategorySchema), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const { id } = await s.category.handleCreate(body, auth.userId)
        return res.created({ id })
      },
      { body: productCategoryMutationSchema, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .patch(
      '/update',
      async function update({ body, auth }) {
        const { id } = await s.category.handleUpdate(body.id, body, auth.userId)
        return res.ok({ id })
      },
      {
        body: productCategoryMutationSchema.extend(zRecordIdDto.shape),
        response: createSuccessResponseSchema(zRecordIdDto),
        auth: true,
      },
    )
    .delete(
      '/remove',
      async function remove({ query, auth }) {
        await s.category.handleRemove(query.id, auth.userId)
        return res.ok({ id: query.id })
      },
      { query: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .delete(
      '/hard-remove',
      async function hardRemove({ query }) {
        await s.category.handleHardRemove(query.id)
        return res.ok({ id: query.id })
      },
      { query: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
}

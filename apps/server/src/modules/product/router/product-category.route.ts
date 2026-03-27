import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zId, zPaginationSchema, zRecordIdSchema, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/core/validation'

import { ProductCategoryDto, ProductCategoryFilterDto, ProductCategoryMutationDto } from '../dto'
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
        query: z.object({ ...zPaginationSchema.shape, ...ProductCategoryFilterDto.shape }),
        response: createPaginatedResponseSchema(ProductCategoryDto.array()),
        auth: true,
      },
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const category = await s.category.handleDetail(query.id)
        return res.ok(category)
      },
      { query: zRecordIdSchema, response: createSuccessResponseSchema(ProductCategoryDto), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const { id } = await s.category.handleCreate(body, auth.userId)
        return res.created({ id })
      },
      { body: ProductCategoryMutationDto, response: createSuccessResponseSchema(zRecordIdSchema), auth: true },
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const { id } = await s.category.handleUpdate(body.id, body, auth.userId)
        return res.ok({ id })
      },
      {
        body: z.object({ id: zId, ...ProductCategoryMutationDto.shape }),
        response: createSuccessResponseSchema(zRecordIdSchema),
        auth: true,
      },
    )
    .delete(
      '/remove',
      async function remove({ query }) {
        await s.category.handleRemove(query.id)
        return res.ok({ id: query.id })
      },
      { query: zRecordIdSchema, response: createSuccessResponseSchema(zRecordIdSchema), auth: true },
    )
}

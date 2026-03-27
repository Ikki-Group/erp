import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zHttp, zPrimitive, zResponse, zSchema } from '@/core/validation'

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
        query: z.object({ ...zHttp.pagination.shape, ...ProductCategoryFilterDto.shape }),
        response: zResponse.paginated(ProductCategoryDto.array()),
        auth: true,
      },
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const category = await s.category.handleDetail(query.id)
        return res.ok(category)
      },
      { query: zHttp.recordId, response: zResponse.ok(ProductCategoryDto), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const { id } = await s.category.handleCreate(body, auth.userId)
        return res.created({ id })
      },
      { body: ProductCategoryMutationDto, response: zResponse.ok(zSchema.recordId), auth: true },
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const { id } = await s.category.handleUpdate(body.id, body, auth.userId)
        return res.ok({ id })
      },
      {
        body: z.object({ id: zPrimitive.id, ...ProductCategoryMutationDto.shape }),
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      },
    )
    .delete(
      '/remove',
      async function remove({ query }) {
        await s.category.handleRemove(query.id)
        return res.ok({ id: query.id })
      },
      { query: zHttp.recordId, response: zResponse.ok(zSchema.recordId), auth: true },
    )
}

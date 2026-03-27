import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zId, zPaginationDto, zRecordIdDto, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/core/validation'

import { MaterialCategoryFilterDto, MaterialCategoryMutationDto, MaterialCategoryDto } from '../dto'
import type { MaterialServiceModule } from '../service'

export function initMaterialCategoryRoute(s: MaterialServiceModule) {
  return new Elysia({ prefix: '/category' })
    .use(authPluginMacro)
    .get(
      '/list',
      async function list({ query }) {
        const result = await s.category.handleList(query, query)
        return res.paginated(result)
      },
      {
        query: z.object({ ...MaterialCategoryFilterDto.shape, ...zPaginationDto.shape }),
        response: createPaginatedResponseSchema(MaterialCategoryDto.array()),
        auth: true,
      },
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const materialCategory = await s.category.handleDetail(query.id)
        return res.ok(materialCategory)
      },
      { query: zRecordIdDto, response: createSuccessResponseSchema(MaterialCategoryDto), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const { id } = await s.category.handleCreate(body, auth.userId)
        return res.created({ id })
      },
      { body: MaterialCategoryMutationDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const { id } = await s.category.handleUpdate(body.id, body, auth.userId)
        return res.ok({ id })
      },
      {
        body: z.object({ id: zId, ...MaterialCategoryMutationDto.shape }),
        response: createSuccessResponseSchema(zRecordIdDto),
        auth: true,
      },
    )
    .delete(
      '/remove',
      async function remove({ query }) {
        await s.category.handleRemove(query.id)
        return res.ok({ id: query.id })
      },
      { query: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
}

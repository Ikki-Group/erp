import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/lib/elysia/auth-plugin'
import { res } from '@/lib/utils/response.util'
import { zHttp, zPrimitive, zResponse, zSchema } from '@/lib/validation'

import { MaterialCategoryDto, MaterialCategoryFilterDto, MaterialCategoryMutationDto } from '../dto'
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
        query: z.object({
          ...zHttp.pagination.shape,
          ...MaterialCategoryFilterDto.shape,
        }),
        response: zResponse.paginated(MaterialCategoryDto.array()),
        auth: true,
      }
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const materialCategory = await s.category.handleDetail(query.id)
        return res.ok(materialCategory)
      },
      {
        query: zHttp.recordId,
        response: zResponse.ok(MaterialCategoryDto),
        auth: true,
      }
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const { id } = await s.category.handleCreate(body, auth.userId)
        return res.created({ id }, 'MATERIAL_CATEGORY_CREATED')
      },
      {
        body: MaterialCategoryMutationDto,
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const { id } = await s.category.handleUpdate(body.id, body, auth.userId)
        return res.ok({ id }, 'MATERIAL_CATEGORY_UPDATED')
      },
      {
        body: z.object({
          id: zPrimitive.objId,
          ...MaterialCategoryMutationDto.shape,
        }),
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
    .delete(
      '/remove',
      async function remove({ query }) {
        await s.category.handleRemove(query.id)
        return res.ok({ id: query.id }, 'MATERIAL_CATEGORY_DELETED')
      },
      {
        query: zHttp.recordId,
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
}

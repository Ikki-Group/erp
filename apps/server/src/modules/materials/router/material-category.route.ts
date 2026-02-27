import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/lib/elysia/auth-plugin'
import { res } from '@/lib/utils/response.util'
import { zHttp, zResponse, zSchema } from '@/lib/validation'

import {
  MaterialCategoryCreateDto,
  MaterialCategoryDto,
  MaterialCategoryFilterDto,
  MaterialCategoryUpdateDto,
} from '../dto'
import type { MaterialServiceModule } from '../service'

export function initMaterialCategoryRoute(s: MaterialServiceModule) {
  return new Elysia({ prefix: '/category' })
    .use(authPluginMacro)
    .get(
      '/list',
      async function list({ query }) {
        const result = await s.category.findPaginated(query, query)
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
        const materialCategory = await s.category.findById(query.id)
        return res.ok(materialCategory)
      },
      {
        query: z.object({ id: zHttp.query.idRequired }),
        response: zResponse.ok(MaterialCategoryDto),
        auth: true,
      }
    )
    .post(
      '/create',
      async function create({ body }) {
        const { id } = await s.category.create(body)
        return res.created({ id }, 'MATERIAL_CATEGORY_CREATED')
      },
      {
        body: MaterialCategoryCreateDto,
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
    .put(
      '/update',
      async function update({ body }) {
        const { id } = await s.category.update(body)
        return res.ok({ id }, 'MATERIAL_CATEGORY_UPDATED')
      },
      {
        body: MaterialCategoryUpdateDto,
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
    .delete(
      '/remove',
      async function remove({ query }) {
        await s.category.remove(query.id)
        return res.ok({ id: query.id }, 'MATERIAL_CATEGORY_DELETED')
      },
      {
        query: z.object({ id: zHttp.query.idRequired }),
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
}

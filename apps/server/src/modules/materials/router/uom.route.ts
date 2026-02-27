import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/lib/elysia/auth-plugin'
import { res } from '@/lib/utils/response.util'
import { zHttp, zResponse, zSchema } from '@/lib/validation'

import { UomCreateDto, UomDto, UomFilterDto, UomUpdateDto } from '../dto'
import type { MaterialServiceModule } from '../service'

export function initMaterialUomRoute(s: MaterialServiceModule) {
  return new Elysia({ prefix: '/uom' })
    .use(authPluginMacro)
    .get(
      '/list',
      async function list({ query }) {
        const result = await s.uom.findPaginated(query, query)
        return res.paginated(result)
      },
      {
        query: z.object({
          ...zHttp.pagination.shape,
          ...UomFilterDto.shape,
        }),
        response: zResponse.paginated(UomDto.array()),
        auth: true,
      }
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const category = await s.uom.findById(query.id)
        return res.ok(category)
      },
      {
        query: z.object({ id: zHttp.query.idRequired }),
        response: zResponse.ok(UomDto),
        auth: true,
      }
    )
    .post(
      '/create',
      async function create({ body }) {
        const { id } = await s.uom.create(body)
        return res.created({ id }, 'MATERIAL_CATEGORY_CREATED')
      },
      {
        body: UomCreateDto,
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
    .put(
      '/update',
      async function update({ body }) {
        const { id } = await s.uom.update(body)
        return res.ok({ id }, 'MATERIAL_CATEGORY_UPDATED')
      },
      {
        body: UomUpdateDto,
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
    .delete(
      '/remove',
      async function remove({ query }) {
        await s.uom.remove(query.id)
        return res.ok({ id: query.id }, 'MATERIAL_CATEGORY_DELETED')
      },
      {
        query: z.object({ id: zHttp.query.idRequired }),
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
}

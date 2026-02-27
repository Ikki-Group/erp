import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/lib/elysia/auth-plugin'
import { res } from '@/lib/utils/response.util'
import { zHttp, zPrimitive, zResponse } from '@/lib/validation'

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
        const category = await s.uom.findByCode(query.code)
        return res.ok(category)
      },
      {
        query: z.object({ code: zPrimitive.str }),
        response: zResponse.ok(UomDto),
      }
    )
    .post(
      '/create',
      async function create({ body }) {
        const { code } = await s.uom.create(body)
        return res.created({ code }, 'MATERIAL_CATEGORY_CREATED')
      },
      {
        body: UomCreateDto,
        response: zResponse.ok(z.object({ code: zPrimitive.str })),
      }
    )
    .put(
      '/update',
      async function update({ body }) {
        const { code } = await s.uom.update(body)
        return res.ok({ code }, 'MATERIAL_CATEGORY_UPDATED')
      },
      {
        body: UomUpdateDto,
        response: zResponse.ok(z.object({ code: zPrimitive.str })),
      }
    )
    .delete(
      '/remove',
      async function remove({ query }) {
        await s.uom.remove(query.code)
        return res.ok({ code: query.code }, 'MATERIAL_CATEGORY_DELETED')
      },
      {
        query: z.object({ code: zPrimitive.str }),
        response: zResponse.ok(z.object({ code: zPrimitive.str })),
      }
    )
}

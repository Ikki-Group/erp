import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/lib/elysia/auth-plugin'
import { res } from '@/lib/utils/response.util'
import { zHttp, zResponse, zSchema } from '@/lib/validation'

import { MaterialCreateDto, MaterialFilterDto, MaterialSelectDto, MaterialUpdateDto } from '../dto'
import type { MaterialServiceModule } from '../service'

export function initMaterialRoute(s: MaterialServiceModule) {
  return new Elysia()
    .use(authPluginMacro)
    .get(
      '/list',
      async function list({ query }) {
        const result = await s.material.findMaterialSelect(query, query)
        return res.paginated(result)
      },
      {
        query: z.object({
          ...zHttp.pagination.shape,
          ...MaterialFilterDto.shape,
        }),
        response: zResponse.paginated(MaterialSelectDto.array()),
        auth: true,
      }
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const category = await s.material.findById(query.id)
        return res.ok(category)
      },
      {
        query: z.object({ id: zHttp.query.idRequired }),
        response: zResponse.ok(MaterialSelectDto),
        auth: true,
      }
    )
    .post(
      '/create',
      async function create({ body }) {
        const { id } = await s.material.create(body)
        return res.created({ id })
      },
      {
        body: MaterialCreateDto,
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
    .put(
      '/update',
      async function update({ body }) {
        const { id } = await s.material.update(body)
        return res.ok({ id })
      },
      {
        body: MaterialUpdateDto,
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
    .delete(
      '/remove',
      async function remove({ query }) {
        await s.material.remove(query.id)
        return res.ok({ id: query.id })
      },
      {
        query: zSchema.recordId,
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
}

import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zHttp, zPrimitive, zResponse, zSchema } from '@/core/validation'

import { UomDto, UomFilterDto, UomMutationDto } from '../dto'
import type { MaterialServiceModule } from '../service'

export function initMaterialUomRoute(s: MaterialServiceModule) {
  return new Elysia({ prefix: '/uom' })
    .use(authPluginMacro)
    .get(
      '/list',
      async function list({ query }) {
        const result = await s.uom.handleList(query, query)
        return res.paginated(result)
      },
      {
        query: z.object({ ...zHttp.pagination.shape, ...UomFilterDto.shape }),
        response: zResponse.paginated(UomDto.array()),
        auth: true,
      },
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const category = await s.uom.handleDetail(query.id)
        return res.ok(category)
      },
      { query: zHttp.recordId, response: zResponse.ok(UomDto), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const { id } = await s.uom.handleCreate(body, auth.userId)
        return res.created({ id })
      },
      { body: UomMutationDto, response: zResponse.ok(zSchema.recordId), auth: true },
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const { id } = await s.uom.handleUpdate(body.id, body, auth.userId)
        return res.ok({ id })
      },
      {
        body: z.object({ id: zPrimitive.id, ...UomMutationDto.shape }),
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      },
    )
    .delete(
      '/remove',
      async function remove({ query }) {
        await s.uom.handleRemove(query.id)
        return res.ok({ id: query.id })
      },
      { query: zHttp.recordId, response: zResponse.ok(zSchema.recordId), auth: true },
    )
}

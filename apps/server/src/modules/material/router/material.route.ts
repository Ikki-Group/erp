import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zHttp, zPrimitive, zResponse, zSchema } from '@/core/validation'

import { MaterialFilterDto, MaterialMutationDto, MaterialSelectDto } from '../dto'
import type { MaterialServiceModule } from '../service'

export function initMaterialRoute(s: MaterialServiceModule) {
  return new Elysia()
    .use(authPluginMacro)
    .get(
      '/list',
      async function list({ query }) {
        const result = await s.material.handleList(query, query)
        return res.paginated(result)
      },
      {
        query: z.object({ ...zHttp.pagination.shape, ...MaterialFilterDto.shape }),
        response: zResponse.paginated(MaterialSelectDto.array()),
        auth: true,
      },
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const category = await s.material.handleDetail(query.id)
        return res.ok(category)
      },
      { query: zHttp.recordId, response: zResponse.ok(MaterialSelectDto), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const { id } = await s.material.handleCreate(body, auth.userId)
        return res.created({ id })
      },
      { body: MaterialMutationDto, response: zResponse.ok(zSchema.recordId), auth: true },
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const { id } = await s.material.handleUpdate(body.id, body, auth.userId)
        return res.ok({ id })
      },
      {
        body: z.object({ id: zPrimitive.id, ...MaterialMutationDto.shape }),
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      },
    )
    .delete(
      '/remove',
      async function remove({ query }) {
        await s.material.handleRemove(query.id)
        return res.ok({ id: query.id })
      },
      { query: zHttp.recordId, response: zResponse.ok(zSchema.recordId), auth: true },
    )
}

import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zId, zPaginationDto, zRecordIdDto, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/core/validation'

import { UomFilterDto, UomMutationDto, UomDto } from '../dto'
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
        query: z.object({ ...UomFilterDto.shape, ...zPaginationDto.shape }),
        response: createPaginatedResponseSchema(UomDto.array()),
        auth: true,
      },
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const category = await s.uom.handleDetail(query.id)
        return res.ok(category)
      },
      { query: zRecordIdDto, response: createSuccessResponseSchema(UomDto), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const { id } = await s.uom.handleCreate(body, auth.userId)
        return res.created({ id })
      },
      { body: UomMutationDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const { id } = await s.uom.handleUpdate(body.id, body, auth.userId)
        return res.ok({ id })
      },
      {
        body: z.object({ id: zId, ...UomMutationDto.shape }),
        response: createSuccessResponseSchema(zRecordIdDto),
        auth: true,
      },
    )
    .delete(
      '/remove',
      async function remove({ query }) {
        await s.uom.handleRemove(query.id)
        return res.ok({ id: query.id })
      },
      { query: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
}

import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zId, zPaginationSchema, zRecordIdSchema, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/core/validation'

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
        query: z.object({ ...zPaginationSchema.shape, ...UomFilterDto.shape }),
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
      { query: zRecordIdSchema, response: createSuccessResponseSchema(UomDto), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const { id } = await s.uom.handleCreate(body, auth.userId)
        return res.created({ id })
      },
      { body: UomMutationDto, response: createSuccessResponseSchema(zRecordIdSchema), auth: true },
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const { id } = await s.uom.handleUpdate(body.id, body, auth.userId)
        return res.ok({ id })
      },
      {
        body: z.object({ id: zId, ...UomMutationDto.shape }),
        response: createSuccessResponseSchema(zRecordIdSchema),
        auth: true,
      },
    )
    .delete(
      '/remove',
      async function remove({ query }) {
        await s.uom.handleRemove(query.id)
        return res.ok({ id: query.id })
      },
      { query: zRecordIdSchema, response: createSuccessResponseSchema(zRecordIdSchema), auth: true },
    )
}

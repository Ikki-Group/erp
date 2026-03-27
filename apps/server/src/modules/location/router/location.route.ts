import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zId, zQueryId, zPaginationSchema, zRecordIdSchema, createSuccessResponseSchema } from '@/core/validation'

import { LocationFilterDto, LocationMutationDto } from '../dto'
import type { LocationService } from '../service/location.service'

export function initLocationRoute(service: LocationService) {
  return new Elysia()
    .use(authPluginMacro)
    .get(
      '/list',
      async function list({ query }) {
        const { isActive, search, type, page, limit } = query
        const result = await service.handleList({ isActive, search, type }, { page, limit })
        return res.paginated(result)
      },
      { query: z.object({ ...zPaginationSchema.shape, ...LocationFilterDto.shape }), auth: true },
    )
    .get(
      '/detail',
      async function getLocationById({ query }) {
        const location = await service.handleDetail(query.id)
        return res.ok(location)
      },
      { query: z.object({ id: zQueryId }), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const { id } = await service.handleCreate(body, auth.userId)
        return res.created({ id }, 'LOCATION_CREATED')
      },
      { body: LocationMutationDto, response: createSuccessResponseSchema(zRecordIdSchema), auth: true },
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const { id } = await service.handleUpdate(body.id, body, auth.userId)
        return res.ok({ id }, 'LOCATION_UPDATED')
      },
      {
        body: z.object({ id: zId, ...LocationMutationDto.shape }),
        response: createSuccessResponseSchema(zRecordIdSchema),
        auth: true,
      },
    )
    .delete(
      '/remove',
      async function remove({ body }) {
        const result = await service.handleRemove(body.id)
        return res.ok(result, 'LOCATION_DELETED')
      },
      { body: zRecordIdSchema, response: createSuccessResponseSchema(zRecordIdSchema), auth: true },
    )
}

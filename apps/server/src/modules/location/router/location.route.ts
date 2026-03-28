import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zId, zPaginationDto, zRecordIdDto, createSuccessResponseSchema } from '@/core/validation'

import { LocationFilterDto, LocationMutationDto, LocationDto } from '../dto'
import type { LocationService } from '../service/location.service'

export function initLocationRoute(service: LocationService) {
  return new Elysia()
    .use(authPluginMacro)
    .get(
      '/list',
      async function list({ query }) {
        const result = await service.handleList(query, query)
        return res.paginated(result)
      },
      {
        query: z.object({ ...LocationFilterDto.shape, ...zPaginationDto.shape }),
        auth: true,
      },
    )
    .get(
      '/detail',
      async function getLocationById({ query }) {
        const location = await service.handleDetail(query.id)
        return res.ok(location)
      },
      { query: zRecordIdDto, response: createSuccessResponseSchema(LocationDto), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const { id } = await service.handleCreate(body, auth.userId)
        return res.created({ id }, 'LOCATION_CREATED')
      },
      { body: LocationMutationDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const { id } = await service.handleUpdate(body.id, body, auth.userId)
        return res.ok({ id }, 'LOCATION_UPDATED')
      },
      {
        body: z.object({ id: zId, ...LocationMutationDto.shape }),
        response: createSuccessResponseSchema(zRecordIdDto),
        auth: true,
      },
    )
    .delete(
      '/remove',
      async function remove({ body, auth }) {
        const result = await service.handleRemove(body.id, auth.userId)
        return res.ok(result, 'LOCATION_DELETED')
      },
      { body: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .delete(
      '/hard-remove',
      async function hardRemove({ body }) {
        const result = await service.handleHardRemove(body.id)
        return res.ok(result, 'LOCATION_HARD_DELETED')
      },
      { body: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
}

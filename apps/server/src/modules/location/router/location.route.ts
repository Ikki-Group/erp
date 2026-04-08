import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zRecordIdDto } from '@/core/validation'

import * as dto from '../dto/location.dto'
import type { LocationService } from '../service/location.service'

/**
 * Location Module Route (Layer 1)
 * Standard functional route pattern (Golden Path 2.1).
 */
export function initLocationRoute(service: LocationService) {
  return new Elysia()
    .use(authPluginMacro)
    .get(
      '/list',
      async function list({ query }) {
        const result = await service.handleList(query)
        return res.paginated(result)
      },
      { query: dto.LocationFilterDto, response: createPaginatedResponseSchema(dto.LocationDto), auth: true },
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const result = await service.handleDetail(query.id)
        return res.ok(result)
      },
      { query: zRecordIdDto, response: createSuccessResponseSchema(dto.LocationDto), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const result = await service.handleCreate(body, auth.userId)
        return res.ok(result)
      },
      { body: dto.LocationCreateDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .patch(
      '/update',
      async function update({ body, auth }) {
        const { id, ...data } = body
        const result = await service.handleUpdate(id, data, auth.userId)
        return res.ok(result)
      },
      { body: dto.LocationUpdateDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .delete(
      '/remove',
      async function remove({ body, auth }) {
        const result = await service.handleRemove(body.id, auth.userId)
        return res.ok(result)
      },
      { body: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .delete(
      '/hard-remove',
      async function hardRemove({ body }) {
        const result = await service.handleHardRemove(body.id)
        return res.ok(result)
      },
      { body: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
}

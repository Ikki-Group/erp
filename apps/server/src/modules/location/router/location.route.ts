import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/lib/elysia/auth-plugin'
import { res } from '@/lib/utils/response.util'
import { zHttp, zPrimitive, zResponse, zSchema } from '@/lib/validation'

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
      {
        query: z.object({
          ...zHttp.pagination.shape,
          ...LocationFilterDto.shape,
        }),
        auth: true,
      }
    )
    .get(
      '/detail',
      async function getLocationById({ query }) {
        const location = await service.handleDetail(query.id)
        return res.ok(location)
      },
      {
        query: z.object({ id: zHttp.query.id }),
        auth: true,
      }
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const { id } = await service.handleCreate(body, auth.userId)
        return res.created({ id }, 'LOCATION_CREATED')
      },
      {
        body: LocationMutationDto,
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const { id } = await service.handleUpdate(body.id, body, auth.userId)
        return res.ok({ id }, 'LOCATION_UPDATED')
      },
      {
        body: z.object({
          id: zPrimitive.id,
          ...LocationMutationDto.shape,
        }),
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      }
    )
}

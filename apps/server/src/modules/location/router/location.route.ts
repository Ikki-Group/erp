import Elysia from 'elysia'
import z from 'zod'

import { res } from '@/lib/utils/response.util'
import { zHttp, zResponse, zSchema } from '@/lib/validation'

import { LocationCreateDto, LocationFilterDto, LocationUpdateDto } from '../dto'
import type { LocationService } from '../service/location.service'

export function initLocationRoute(service: LocationService) {
  return new Elysia()
    .get(
      '/list',
      async function list({ query }) {
        const { isActive, search, type, page, limit } = query
        const result = await service.listPaginated({ isActive, search, type }, { page, limit })
        return res.paginated(result)
      },
      {
        query: z.object({
          ...zHttp.pagination.shape,
          ...LocationFilterDto.shape,
        }),
      }
    )
    .get(
      '/detail',
      async function getLocationById({ query }) {
        const location = await service.getById(query.id)
        return res.ok(location)
      },
      {
        query: z.object({ id: zHttp.query.idRequired }),
      }
    )
    .post(
      '/create',
      async function create({ body }) {
        const { id } = await service.create(body)
        return res.created({ id }, 'LOCATION_CREATED')
      },
      {
        body: LocationCreateDto,
        response: zResponse.ok(zSchema.recordId),
      }
    )
    .put(
      '/update',
      async function update({ body }) {
        const { id } = await service.update(body.id, body)
        return res.ok({ id }, 'LOCATION_UPDATED')
      },
      {
        body: LocationUpdateDto,
        response: zResponse.ok(zSchema.recordId),
      }
    )
}

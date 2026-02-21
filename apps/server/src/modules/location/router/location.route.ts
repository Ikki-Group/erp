import Elysia from 'elysia'
import z from 'zod'

import { res } from '@/lib/utils/response.util'
import { zHttp } from '@/lib/validation'

import { LocationMutationDto, LocationType } from '../dto'
import type { LocationService } from '../service/location.service'

export function initLocationRoute(service: LocationService) {
  return new Elysia()
    .get(
      '/list',
      async function getLocations({ query }) {
        const { isActive, search, type, page, limit } = query
        const result = await service.listPaginated({ isActive, search, type }, { page, limit })
        return res.paginated(result)
      },
      {
        query: z.object({
          ...zHttp.pagination.shape,
          search: zHttp.query.search,
          type: LocationType.optional(),
          isActive: zHttp.query.boolean,
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
      async function createLocation({ body }) {
        const location = await service.create(body)
        return res.created(location, 'LOCATION_CREATED')
      },
      {
        body: LocationMutationDto,
      }
    )
    .put(
      '/update',
      async function updateLocation({ body }) {
        const location = await service.update(body.id, body)
        return res.ok(location, 'LOCATION_UPDATED')
      },
      {
        body: z.object({
          id: zHttp.query.idRequired,
          ...LocationMutationDto.pick({
            code: true,
            name: true,
            type: true,
            description: true,
            isActive: true,
          }).shape,
        }),
      }
    )
}

import Elysia from 'elysia'
import z from 'zod'

import { res } from '@/lib/utils/response.util'
import { zSchema } from '@/lib/zod'

import { LocationSchema, LocationType } from '../location.schema'
import type { LocationService } from '../service/location.service'

/**
 * Location Routes
 */
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
          ...zSchema.pagination.shape,
          search: zSchema.query.search,
          type: LocationType.optional(),
          isActive: zSchema.query.boolean,
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
        query: z.object({ id: zSchema.query.idRequired }),
      }
    )
    .post(
      '/create',
      async function createLocation({ body }) {
        const location = await service.create(body)
        return res.created(location, 'LOCATION_CREATED')
      },
      {
        body: LocationSchema.pick({
          code: true,
          name: true,
          type: true,
          description: true,
          isActive: true,
        }),
      }
    )
    .put(
      '/update',
      async function updateLocation({ body }) {
        const location = await service.update(body.id, body)
        return res.ok(location, 'LOCATION_UPDATED')
      },
      {
        body: LocationSchema.pick({
          id: true,
          code: true,
          name: true,
          type: true,
          description: true,
          isActive: true,
        }),
      }
    )
}

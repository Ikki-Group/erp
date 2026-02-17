import Elysia from 'elysia'
import z from 'zod'

import { logger } from '@/lib/logger'
import { res } from '@/lib/utils/response.util'
import { zResponse, zSchema } from '@/lib/zod'

import { LocationSchema } from '../locations.types'
import type { LocationsService } from '../service/locations.service'

/**
 * Location Routes
 */
export function initLocationRoute(service: LocationsService) {
  return new Elysia()
    .get(
      '/list',
      async function getLocations({ query }) {
        const { isActive, search, type, page, limit } = query
        const result = await service.listPaginated({ isActive, search, type }, { page, limit })
        logger.withMetadata(result).debug('Locations List Response')
        return res.paginated(result)
      },
      {
        query: z.object({
          ...zSchema.pagination.shape,
          search: zSchema.query.search,
          type: z.enum(['store', 'warehouse', 'central_warehouse']).optional(),
          isActive: zSchema.query.boolean,
        }),
        response: zResponse.paginated(LocationSchema.Location.array()),
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
        response: zResponse.ok(LocationSchema.Location),
      }
    )
    .post(
      '/create',
      async function createLocation({ body }) {
        const location = await service.create(body)
        return res.created(location, 'LOCATION_CREATED')
      },
      {
        body: LocationSchema.Location.pick({
          code: true,
          name: true,
          type: true,
          description: true,
        }),
        response: zResponse.ok(LocationSchema.Location),
      }
    )
    .put(
      '/update',
      async function updateLocation({ body }) {
        const location = await service.update(body.id, body)
        return res.ok(location, 'LOCATION_UPDATED')
      },
      {
        body: LocationSchema.Location.pick({
          id: true,
          code: true,
          name: true,
          type: true,
          description: true,
          isActive: true,
        }).partial({
          code: true,
          name: true,
          type: true,
          description: true,
          isActive: true,
        }),
        response: zResponse.ok(LocationSchema.Location),
      }
    )
    .delete(
      '/delete',
      async function deleteLocation({ body }) {
        await service.delete(body.id)
        return res.ok({ id: body.id }, 'LOCATION_DELETED')
      },
      {
        body: LocationSchema.Location.pick({ id: true }),
        response: zResponse.ok(LocationSchema.Location.pick({ id: true })),
      }
    )
    .patch(
      '/toggle-active',
      async function toggleLocationActive({ body }) {
        const location = await service.toggleActive(body.id)
        return res.ok(location, 'LOCATION_STATUS_TOGGLED')
      },
      {
        body: LocationSchema.Location.pick({ id: true }),
        response: zResponse.ok(LocationSchema.Location),
      }
    )
}

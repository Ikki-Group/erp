import { Elysia, t } from 'elysia'

import { paginatedResponse, successResponse } from '@/shared/responses'

import { LocationDto } from './location.dto'
import { locationService } from './location.service'

/**
 * Location Management Controller
 * Handles CRUD operations for locations
 */
export const locationController = new Elysia({
  prefix: '/location',
  detail: { tags: ['Location Management'] },
})
  /**
   * Get all locations with pagination and filters
   */
  .get(
    '',
    async ({ query }) => {
      const result = await locationService.getLocations(query)
      return paginatedResponse(result.data, result.meta)
    },
    { query: LocationDto.LocationQuery }
  )

  /**
   * Get location by ID
   */
  .get(
    '/:id',
    async ({ params: { id } }) => {
      const location = await locationService.getLocationById(id)
      return successResponse(location)
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid', description: 'Location ID' }),
      }),
    }
  )

  /**
   * Create new location
   */
  .post(
    '',
    async ({ body }) => {
      const location = await locationService.createLocation(body)
      return successResponse(location, 'Location created successfully')
    },
    { body: LocationDto.LocationCreate }
  )

  /**
   * Update location by ID
   */
  .put(
    '/:id',
    async ({ params: { id }, body }) => {
      const location = await locationService.updateLocation(id, body)
      return successResponse(location, 'Location updated successfully')
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid', description: 'Location ID' }),
      }),
      body: LocationDto.LocationUpdate,
    }
  )

  /**
   * Delete location by ID (soft delete)
   */
  .delete(
    '/:id',
    async ({ params: { id } }) => {
      const location = await locationService.deleteLocation(id)
      return successResponse(location, 'Location deleted successfully')
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid', description: 'Location ID' }),
      }),
    }
  )

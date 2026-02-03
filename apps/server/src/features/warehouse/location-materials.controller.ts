import { Elysia, t } from 'elysia'

import { LocationMaterialsDto } from '@/features/warehouse/location-materials.dto'
import { successResponse } from '@/shared/responses'

import { locationMaterialsService } from './location-materials.service'

/**
 * Location-Material Mapping Controller
 * Handles material assignments to locations
 */
export const locationMaterialsController = new Elysia({
  prefix: '/inventory/location',
  detail: { tags: ['Inventory - Location Material'] },
})
  /**
   * Get all materials for a location
   */
  .get(
    '/:locationId/materials',
    async ({ params: { locationId } }) => {
      const materials = await locationMaterialsService.getLocationMaterials(locationId)
      return successResponse(materials)
    },
    {
      params: t.Object({
        locationId: t.String({ format: 'uuid', description: 'Location ID' }),
      }),
    }
  )

  /**
   * Assign materials to a location
   */
  .post(
    '/:locationId/materials',
    async ({ params: { locationId }, body }) => {
      const result = await locationMaterialsService.assignMaterialsToLocation(locationId, body)
      return successResponse(result, 'Materials assigned to location successfully')
    },
    {
      params: t.Object({
        locationId: t.String({ format: 'uuid', description: 'Location ID' }),
      }),
      body: LocationMaterialsDto.AssignMaterials,
    }
  )

  /**
   * Unassign material from location
   */
  .delete(
    '/:locationId/materials/:materialId',
    async ({ params: { locationId, materialId } }) => {
      const result = await locationMaterialsService.unassignMaterialFromLocation(locationId, materialId)
      return successResponse(result, 'Material unassigned from location successfully')
    },
    {
      params: t.Object({
        locationId: t.String({ format: 'uuid', description: 'Location ID' }),
        materialId: t.String({ format: 'uuid', description: 'Material ID' }),
      }),
    }
  )

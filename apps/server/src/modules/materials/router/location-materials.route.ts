import { res } from '@/lib/utils/response.util'
import { zHttp, zPrimitive, zResponse } from '@/lib/validation'
import Elysia from 'elysia'
import z from 'zod'

import { MaterialsRequest, MaterialsSchema } from '../materials.types'
import type { LocationMaterialsService } from '../service/location-materials.service'

/**
 * Location Materials Router
 */
export function buildLocationMaterialsRoute(service: LocationMaterialsService) {
  return new Elysia({ prefix: '/location-materials' })
    .get(
      '/location/:locationId',
      async function listLocationMaterials({ params, query }) {
        const { search, isActive, page, limit } = query
        const result = await service.listByLocation(params.locationId, { search, isActive }, { page, limit })
        return res.paginated(result)
      },
      {
        params: z.object({ locationId: zPrimitive.numCoerce }),
        query: z.object({
          ...zHttp.pagination.shape,
          search: zHttp.query.search,
          isActive: zHttp.query.boolean,
        }),
        response: zResponse.paginated(MaterialsSchema.LocationMaterialDetail.array()),
      }
    )
    .get(
      '/material/:materialId',
      async function listMaterialLocations({ params }) {
        const locations = await service.listByMaterial(params.materialId)
        return res.ok(locations)
      },
      {
        params: z.object({ materialId: zPrimitive.numCoerce }),
        response: zResponse.ok(MaterialsSchema.LocationMaterialDetail.array()),
      }
    )
    .get(
      '/:id',
      async function getLocationMaterialById({ params }) {
        const locationMaterial = await service.getById(params.id)
        return res.ok(locationMaterial)
      },
      {
        params: z.object({ id: zPrimitive.numCoerce }),
        response: zResponse.ok(MaterialsSchema.LocationMaterial),
      }
    )
    .post(
      '/bulk-assign',
      async function bulkAssignMaterialsToStores({ body }) {
        const assignments = await service.bulkAssignToStores(body.materialIds, body.locationIds)
        return res.created(assignments, 'MATERIALS_BULK_ASSIGNED')
      },
      {
        body: MaterialsRequest.BulkAssignLocationMaterials,
        response: zResponse.ok(MaterialsSchema.LocationMaterial.array()),
      }
    )
    .patch(
      '/:id',
      async function updateLocationMaterialConfig({ params, body }) {
        const locationMaterial = await service.updateConfig(params.id, body)
        return res.ok(locationMaterial, 'LOCATION_MATERIAL_UPDATED')
      },
      {
        params: z.object({ id: zPrimitive.numCoerce }),
        body: MaterialsRequest.UpdateLocationMaterial,
        response: zResponse.ok(MaterialsSchema.LocationMaterial),
      }
    )
    .delete(
      '/:id',
      async function removeLocationMaterialAssignment({ params }) {
        await service.removeAssignment(params.id)
        return res.ok({ id: params.id }, 'LOCATION_MATERIAL_REMOVED')
      },
      {
        params: z.object({ id: zPrimitive.numCoerce }),
        response: zResponse.ok(z.object({ id: zPrimitive.num })),
      }
    )
}

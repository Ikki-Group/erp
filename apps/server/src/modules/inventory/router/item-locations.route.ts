import Elysia from 'elysia'
import z from 'zod'

import { res } from '@/lib/utils/response.util'
import { zHttp, zPrimitive, zResponse } from '@/lib/validation'

import { InventoryRequest, InventorySchema } from '../inventory.types'
import type { ItemLocationsService } from '../service/item-locations.service'

/**
 * Item Locations Router
 */
export function buildItemLocationsRoute(service: ItemLocationsService) {
  return new Elysia({ prefix: '/item-locations' })
    .get(
      '/location/:locationId',
      async function listItemLocations({ params, query }) {
        const { search, isAssigned, page, limit } = query
        const result = await service.listByLocation(params.locationId, { search, isAssigned }, { page, limit })
        return res.paginated(result)
      },
      {
        params: z.object({ locationId: zPrimitive.numCoerce }),
        query: z.object({
          ...zHttp.pagination.shape,
          search: zHttp.query.search,
          isAssigned: zHttp.query.boolean,
        }),
        response: zResponse.paginated(InventorySchema.ItemLocationDetail.array()),
      } as any
    )
    .get(
      '/item/:itemId',
      async function listLocationItems({ params }) {
        const locations = await service.listByItem(params.itemId)
        return res.ok(locations)
      },
      {
        params: z.object({ itemId: zPrimitive.numCoerce }),
        response: zResponse.ok(InventorySchema.ItemLocationDetail.array()),
      } as any
    )
    .get(
      '/:id',
      async function getItemLocationById({ params }) {
        const itemLocation = await service.getById(params.id)
        return res.ok(itemLocation)
      },
      {
        params: z.object({ id: zPrimitive.numCoerce }),
        response: zResponse.ok(InventorySchema.ItemLocation),
      } as any
    )
    .post(
      '/bulk-assign',
      async function bulkAssignItemsToStores({ body, user }) {
        const assignments = await service.bulkAssignToStores(body.itemIds, body.locationIds, user?.id)
        return res.created(assignments, 'ITEMS_BULK_ASSIGNED')
      },
      {
        isAuth: true,
        body: InventoryRequest.BulkAssignItemLocations,
        response: zResponse.ok(InventorySchema.ItemLocation.array()),
      } as any
    )
    .patch(
      '/:id',
      async function updateItemLocationConfig({ params, body, user }) {
        const itemLocation = await service.updateConfig(params.id, body, user?.id)
        return res.ok(itemLocation, 'ITEM_LOCATION_UPDATED')
      },
      {
        isAuth: true,
        params: z.object({ id: zPrimitive.numCoerce }),
        body: InventoryRequest.UpdateItemLocation,
        response: zResponse.ok(InventorySchema.ItemLocation),
      } as any
    )
    .delete(
      '/:id',
      async function removeItemLocationAssignment({ params }) {
        await service.removeAssignment(params.id)
        return res.ok({ id: params.id }, 'ITEM_LOCATION_REMOVED')
      },
      {
        isAuth: true,
        params: z.object({ id: zPrimitive.numCoerce }),
        response: zResponse.ok(z.object({ id: zPrimitive.numCoerce })),
      } as any
    )
}

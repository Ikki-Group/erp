import Elysia from 'elysia'
import z from 'zod'

import { res } from '@/lib/utils/response.util'
import { zPrimitive, zResponse } from '@/lib/validation'

import { InventoryRequest, InventorySchema } from '../inventory.types'
import type { ItemUnitConversionsService } from '../service/item-unit-conversions.service'

/**
 * Item Unit Conversions Router
 */
export function buildItemUnitConversionsRoute(service: ItemUnitConversionsService) {
  return new Elysia({ prefix: '/item-unit-conversions' })
    .get(
      '/item/:itemId',
      async function listItemUnitConversions({ params }) {
        const units = await service.listByItem(params.itemId)
        return res.ok(units)
      },
      {
        params: z.object({ itemId: zPrimitive.numCoerce }),
        response: {
          200: zResponse.ok(z.any().array()), // Using any array to workaround mapped views, but should be modeled properly
        },
      } as any
    )
    .get(
      '/:id',
      async function getItemUnitConversionById({ params }) {
        const unit = await service.getById(params.id)
        return res.ok(unit)
      },
      {
        params: z.object({ id: zPrimitive.numCoerce }),
        response: zResponse.ok(InventorySchema.ItemUnitConversion),
      } as any
    )
    .post(
      '/item/:itemId',
      async function assignConversionToItem({ params, body }) {
        const unit = await service.assignConversion(params.itemId, body.fromUnit, body.toUnit, body.multiplier)
        return res.created(unit, 'ITEM_UNIT_CONVERSION_ASSIGNED')
      },
      {
        params: z.object({ itemId: zPrimitive.numCoerce }),
        body: InventoryRequest.CreateUnitConversion,
        response: zResponse.ok(InventorySchema.ItemUnitConversion),
      } as any
    )
    .delete(
      '/:id',
      async function removeItemUnitConversion({ params }) {
        await service.removeConversion(params.id)
        return res.ok({ id: params.id }, 'ITEM_UNIT_CONVERSION_REMOVED')
      },
      {
        params: z.object({ id: zPrimitive.numCoerce }),
        response: zResponse.ok(z.object({ id: zPrimitive.numCoerce })),
      } as any
    )
}

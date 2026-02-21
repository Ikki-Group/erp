import Elysia from 'elysia'
import z from 'zod'

import { res } from '@/lib/utils/response.util'
import { zPrimitive, zResponse } from '@/lib/validation'

import { MaterialsRequest, MaterialsSchema } from '../materials.types'
import type { MaterialUnitsService } from '../service/material-units.service'

/**
 * Material Units Router
 */
export function buildMaterialUnitsRoute(service: MaterialUnitsService) {
  return new Elysia({ prefix: '/material-units' })
    .get(
      '/material/:materialId',
      async function listMaterialUnits({ params }) {
        const units = await service.listByMaterial(params.materialId)
        return res.ok(units)
      },
      {
        params: z.object({ materialId: zPrimitive.numCoerce }),
        response: zResponse.ok(MaterialsSchema.MaterialUnitDetail.array()),
      }
    )
    .get(
      '/material/:materialId/uom/:uom',
      async function getMaterialUnitByKey({ params }) {
        const unit = await service.getByKey(params.materialId, params.uom)
        return res.ok(unit)
      },
      {
        params: z.object({ materialId: zPrimitive.numCoerce, uom: zPrimitive.str }),
        response: zResponse.ok(MaterialsSchema.MaterialUnit),
      }
    )
    .post(
      '/material/:materialId',
      async function assignUomToMaterial({ params, body }) {
        const unit = await service.assignUom(params.materialId, body.uom, body.conversionFactor, body.isBase)
        return res.created(unit, 'MATERIAL_UOM_ASSIGNED')
      },
      {
        params: z.object({ materialId: zPrimitive.numCoerce }),
        body: MaterialsRequest.AssignMaterialUom,
        response: zResponse.ok(MaterialsSchema.MaterialUnit),
      }
    )
    .patch(
      '/material/:materialId/set-base/:uom',
      async function setBaseUnit({ params }) {
        const unit = await service.setBaseUnit(params.materialId, params.uom)
        return res.ok(unit, 'BASE_UNIT_SET')
      },
      {
        params: z.object({
          materialId: zPrimitive.numCoerce,
          uom: zPrimitive.str,
        }),
        response: zResponse.ok(MaterialsSchema.MaterialUnit),
      }
    )
    .delete(
      '/material/:materialId/uom/:uom',
      async function removeUomFromMaterial({ params }) {
        await service.removeUom(params.materialId, params.uom)
        return res.ok({ materialId: params.materialId, uom: params.uom }, 'MATERIAL_UOM_REMOVED')
      },
      {
        params: z.object({ materialId: zPrimitive.numCoerce, uom: zPrimitive.str }),
        response: zResponse.ok(z.object({ materialId: zPrimitive.num, uom: zPrimitive.str })),
      }
    )
}

import { res } from '@server/lib/utils/response.util'
import { zResponse, zSchema } from '@server/lib/zod'
import Elysia from 'elysia'
import z from 'zod'

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
        params: z.object({ materialId: zSchema.numCoerce }),
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
        params: z.object({ materialId: zSchema.numCoerce, uom: zSchema.str }),
        response: zResponse.ok(MaterialsSchema.MaterialUnit),
      }
    )
    .post(
      '/material/:materialId',
      async function assignUomToMaterial({ params, body }) {
        const unit = await service.assignUom(params.materialId, body.uom, body.isBase)
        return res.created(unit, 'MATERIAL_UOM_ASSIGNED')
      },
      {
        params: z.object({ materialId: zSchema.numCoerce }),
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
          materialId: zSchema.numCoerce,
          uom: zSchema.str,
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
        params: z.object({ materialId: zSchema.numCoerce, uom: zSchema.str }),
        response: zResponse.ok(z.object({ materialId: zSchema.num, uom: zSchema.str })),
      }
    )
}

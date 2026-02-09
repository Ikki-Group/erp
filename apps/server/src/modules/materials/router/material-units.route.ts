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
      '/:id',
      async function getMaterialUnitById({ params }) {
        const unit = await service.getById(params.id)
        return res.ok(unit)
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        response: zResponse.ok(MaterialsSchema.MaterialUnit),
      }
    )
    .post(
      '/material/:materialId',
      async function assignUomToMaterial({ params, body }) {
        const unit = await service.assignUom(params.materialId, body.uomId, body.isBaseUnit)
        return res.created(unit, 'MATERIAL_UOM_ASSIGNED')
      },
      {
        params: z.object({ materialId: zSchema.numCoerce }),
        body: MaterialsRequest.AssignMaterialUom,
        response: zResponse.ok(MaterialsSchema.MaterialUnit),
      }
    )
    .patch(
      '/material/:materialId/set-base/:uomId',
      async function setBaseUnit({ params }) {
        const unit = await service.setBaseUnit(params.materialId, params.uomId)
        return res.ok(unit, 'BASE_UNIT_SET')
      },
      {
        params: z.object({
          materialId: zSchema.numCoerce,
          uomId: zSchema.numCoerce,
        }),
        response: zResponse.ok(MaterialsSchema.MaterialUnit),
      }
    )
    .delete(
      '/:id',
      async function removeUomFromMaterial({ params }) {
        await service.removeUom(params.id)
        return res.ok({ id: params.id }, 'MATERIAL_UOM_REMOVED')
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        response: zResponse.ok(z.object({ id: zSchema.num })),
      }
    )
}

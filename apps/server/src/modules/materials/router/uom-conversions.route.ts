import { res } from '@server/lib/utils/response.util'
import { zResponse, zSchema } from '@server/lib/zod'
import Elysia from 'elysia'
import z from 'zod'

import { MaterialsRequest, MaterialsSchema } from '../materials.types'
import type { UomConversionsService } from '../service/uom-conversions.service'

/**
 * UOM Conversions Router
 */
export function buildUomConversionsRoute(service: UomConversionsService) {
  return new Elysia({ prefix: '/uom-conversions' })
    .get(
      '/',
      async function listConversions({ query }) {
        const { fromUomId, toUomId, page, limit } = query
        const result = await service.listPaginated({ fromUomId, toUomId }, { page, limit })
        return res.paginated(result)
      },
      {
        query: z.object({
          ...zSchema.pagination.shape,
          fromUomId: zSchema.query.id,
          toUomId: zSchema.query.id,
        }),
        response: zResponse.paginated(MaterialsSchema.UomConversionDetail.array()),
      }
    )
    .get(
      '/factor',
      async function getConversionFactor({ query }) {
        const factor = await service.getConversionFactor(query.fromUomId, query.toUomId)
        return res.ok({ conversionFactor: factor })
      },
      {
        query: z.object({
          fromUomId: zSchema.numCoerce,
          toUomId: zSchema.numCoerce,
        }),
        response: zResponse.ok(z.object({ conversionFactor: zSchema.str.nullable() })),
      }
    )
    .get(
      '/:id',
      async function getConversionById({ params }) {
        const conversion = await service.getById(params.id)
        return res.ok(conversion)
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        response: zResponse.ok(MaterialsSchema.UomConversion),
      }
    )
    .post(
      '/',
      async function createConversion({ body }) {
        const conversion = await service.create(body)
        return res.created(conversion, 'UOM_CONVERSION_CREATED')
      },
      {
        body: MaterialsRequest.CreateUomConversion,
        response: zResponse.ok(MaterialsSchema.UomConversion),
      }
    )
    .patch(
      '/:id',
      async function updateConversion({ params, body }) {
        const conversion = await service.update(params.id, body)
        return res.ok(conversion, 'UOM_CONVERSION_UPDATED')
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        body: MaterialsRequest.UpdateUomConversion,
        response: zResponse.ok(MaterialsSchema.UomConversion),
      }
    )
    .delete(
      '/:id',
      async function deleteConversion({ params }) {
        await service.delete(params.id)
        return res.ok({ id: params.id }, 'UOM_CONVERSION_DELETED')
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        response: zResponse.ok(z.object({ id: zSchema.num })),
      }
    )
}

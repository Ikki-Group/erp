import { res } from '@server/lib/utils/response.util'
import { zResponse, zSchema } from '@server/lib/zod'
import Elysia from 'elysia'
import z from 'zod'

import { MaterialsRequest, MaterialsSchema } from '../materials.types'
import type { UomService } from '../service/uom.service'

/**
 * Units of Measure Router
 */
export function buildUomRoute(service: UomService) {
  return new Elysia({ prefix: '/uom' })
    .get(
      '/',
      async function listUom({ query }) {
        const { search, isActive, page, limit } = query
        const result = await service.listPaginated({ search, isActive }, { page, limit })
        return res.paginated(result)
      },
      {
        query: z.object({
          ...zSchema.pagination.shape,
          search: zSchema.query.search,
          isActive: zSchema.query.boolean,
        }),
        response: zResponse.paginated(MaterialsSchema.Uom.array()),
      }
    )
    .get(
      '/:id',
      async function getUomById({ params }) {
        const uom = await service.getById(params.id)
        return res.ok(uom)
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        response: zResponse.ok(MaterialsSchema.Uom),
      }
    )
    .post(
      '/',
      async function createUom({ body }) {
        const uom = await service.create(body)
        return res.created(uom, 'UOM_CREATED')
      },
      {
        body: MaterialsRequest.CreateUom,
        response: zResponse.ok(MaterialsSchema.Uom),
      }
    )
    .patch(
      '/:id',
      async function updateUom({ params, body }) {
        const uom = await service.update(params.id, body)
        return res.ok(uom, 'UOM_UPDATED')
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        body: MaterialsRequest.UpdateUom,
        response: zResponse.ok(MaterialsSchema.Uom),
      }
    )
    .delete(
      '/:id',
      async function deleteUom({ params }) {
        await service.delete(params.id)
        return res.ok({ id: params.id }, 'UOM_DELETED')
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        response: zResponse.ok(z.object({ id: zSchema.num })),
      }
    )
    .patch(
      '/:id/toggle-active',
      async function toggleUomActive({ params }) {
        const uom = await service.toggleActive(params.id)
        return res.ok(uom, 'UOM_STATUS_TOGGLED')
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        response: zResponse.ok(MaterialsSchema.Uom),
      }
    )
}

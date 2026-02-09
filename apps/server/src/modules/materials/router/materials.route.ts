import { res } from '@server/lib/utils/response.util'
import { zResponse, zSchema } from '@server/lib/zod'
import Elysia from 'elysia'
import z from 'zod'

import { MaterialsRequest, MaterialsSchema } from '../materials.types'
import type { MaterialsService } from '../service/materials.service'

/**
 * Materials Router
 */
export function buildMaterialsRoute(service: MaterialsService) {
  return new Elysia({ prefix: '/materials' })
    .get(
      '/',
      async function listMaterials({ query }) {
        const { search, type, categoryId, isActive, page, limit } = query
        const result = await service.listPaginated({ search, type, categoryId, isActive }, { page, limit })
        return res.paginated(result)
      },
      {
        query: z.object({
          ...zSchema.pagination.shape,
          search: zSchema.query.search,
          type: z.enum(['raw', 'semi']).optional(),
          categoryId: zSchema.query.id,
          isActive: zSchema.query.boolean,
        }),
        response: zResponse.paginated(MaterialsSchema.MaterialDetail.array()),
      }
    )
    .get(
      '/:id',
      async function getMaterialById({ params }) {
        const material = await service.getById(params.id)
        return res.ok(material)
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        response: zResponse.ok(MaterialsSchema.Material),
      }
    )
    .post(
      '/',
      async function createMaterial({ body }) {
        const material = await service.create(body)
        return res.created(material, 'MATERIAL_CREATED')
      },
      {
        body: MaterialsRequest.CreateMaterial,
        response: zResponse.ok(MaterialsSchema.Material),
      }
    )
    .patch(
      '/:id',
      async function updateMaterial({ params, body }) {
        const material = await service.update(params.id, body)
        return res.ok(material, 'MATERIAL_UPDATED')
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        body: MaterialsRequest.UpdateMaterial,
        response: zResponse.ok(MaterialsSchema.Material),
      }
    )
    .delete(
      '/:id',
      async function deleteMaterial({ params }) {
        await service.delete(params.id)
        return res.ok({ id: params.id }, 'MATERIAL_DELETED')
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        response: zResponse.ok(z.object({ id: zSchema.num })),
      }
    )
    .patch(
      '/:id/toggle-active',
      async function toggleMaterialActive({ params }) {
        const material = await service.toggleActive(params.id)
        return res.ok(material, 'MATERIAL_STATUS_TOGGLED')
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        response: zResponse.ok(MaterialsSchema.Material),
      }
    )
}

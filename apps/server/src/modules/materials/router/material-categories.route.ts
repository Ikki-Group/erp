import { res } from '@server/lib/utils/response.util'
import { zResponse, zSchema } from '@server/lib/zod'
import Elysia from 'elysia'
import z from 'zod'

import { MaterialsRequest, MaterialsSchema } from '../materials.types'
import type { MaterialCategoriesService } from '../service/material-categories.service'

/**
 * Material Categories Router
 */
export function buildMaterialCategoriesRoute(service: MaterialCategoriesService) {
  return new Elysia({ prefix: '/categories' })
    .get(
      '/',
      async function listCategories({ query }) {
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
        response: zResponse.paginated(MaterialsSchema.MaterialCategory.array()),
      }
    )
    .get(
      '/:id',
      async function getCategoryById({ params }) {
        const category = await service.getById(params.id)
        return res.ok(category)
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        response: zResponse.ok(MaterialsSchema.MaterialCategory),
      }
    )
    .post(
      '/',
      async function createCategory({ body }) {
        const category = await service.create(body)
        return res.created(category, 'MATERIAL_CATEGORY_CREATED')
      },
      {
        body: MaterialsRequest.CreateMaterialCategory,
        response: zResponse.ok(MaterialsSchema.MaterialCategory),
      }
    )
    .patch(
      '/:id',
      async function updateCategory({ params, body }) {
        const category = await service.update(params.id, body)
        return res.ok(category, 'MATERIAL_CATEGORY_UPDATED')
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        body: MaterialsRequest.UpdateMaterialCategory,
        response: zResponse.ok(MaterialsSchema.MaterialCategory),
      }
    )
    .delete(
      '/:id',
      async function deleteCategory({ params }) {
        await service.delete(params.id)
        return res.ok({ id: params.id }, 'MATERIAL_CATEGORY_DELETED')
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        response: zResponse.ok(z.object({ id: zSchema.num })),
      }
    )
    .patch(
      '/:id/toggle-active',
      async function toggleCategoryActive({ params }) {
        const category = await service.toggleActive(params.id)
        return res.ok(category, 'MATERIAL_CATEGORY_STATUS_TOGGLED')
      },
      {
        params: z.object({ id: zSchema.numCoerce }),
        response: zResponse.ok(MaterialsSchema.MaterialCategory),
      }
    )
}

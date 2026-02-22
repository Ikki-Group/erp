import Elysia from 'elysia'
import z from 'zod'

import { res } from '@/lib/utils/response.util'
import { zHttp, zPrimitive, zResponse } from '@/lib/validation'

import { InventoryRequest, InventorySchema } from '../inventory.types'
import type { ItemCategoriesService } from '../service/item-category.service'

/**
 * Item Categories Router
 */
export function buildItemCategoriesRoute(service: ItemCategoriesService) {
  return new Elysia({ prefix: '/item-categories' })
    .get(
      '/',
      async function listItemCategories({ query }) {
        const { search, page, limit } = query
        if (page && limit) {
          const result = await service.listPaginated({ search }, { page, limit })
          return res.paginated(result)
        }
        const categories = await service.list()
        return res.ok(categories)
      },
      {
        query: z.object({
          ...zHttp.pagination.shape,
          search: zHttp.query.search,
        }),
        response: {
          200: zResponse.ok(InventorySchema.ItemCategory.array()),
        },
      } as any
    )
    .get(
      '/:id',
      async function getItemCategoryById({ params }) {
        const category = await service.getById(params.id)
        return res.ok(category)
      },
      {
        params: z.object({ id: zPrimitive.numCoerce }),
        response: zResponse.ok(InventorySchema.ItemCategory),
      } as any
    )
    .post(
      '/',
      async function createItemCategory({ body, user }) {
        const category = await service.create(body, user?.id)
        return res.created(category, 'ITEM_CATEGORY_CREATED')
      },
      {
        isAuth: true,
        body: InventoryRequest.CreateItemCategory,
        response: zResponse.ok(InventorySchema.ItemCategory),
      } as any
    )
    .patch(
      '/:id',
      async function updateItemCategory({ params, body, user }) {
        const category = await service.update(params.id, body, user?.id)
        return res.ok(category, 'ITEM_CATEGORY_UPDATED')
      },
      {
        isAuth: true,
        params: z.object({ id: zPrimitive.numCoerce }),
        body: InventoryRequest.UpdateItemCategory,
        response: zResponse.ok(InventorySchema.ItemCategory),
      } as any
    )
    .delete(
      '/:id',
      async function deleteItemCategory({ params }) {
        await service.delete(params.id)
        return res.ok({ id: params.id }, 'ITEM_CATEGORY_DELETED')
      },
      {
        isAuth: true,
        params: z.object({ id: zPrimitive.numCoerce }),
        response: zResponse.ok(z.object({ id: zPrimitive.numCoerce })),
      } as any
    )
}

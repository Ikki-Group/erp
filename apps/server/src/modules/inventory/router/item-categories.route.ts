import Elysia from 'elysia'
import z from 'zod'

import { res } from '@/lib/utils/response.util'
import { zHttp, zPrimitive, zResponse, zSchema } from '@/lib/validation'

import { ItemCategoryCreateDto, ItemCategoryFilterDto, ItemCategoryUpdateDto } from '../dto'
import { InventorySchema } from '../inventory.types'
import type { ItemCategoryService } from '../service/item-category.service'

/**
 * Item Categories Router
 */
export function buildItemCategoriesRoute(service: ItemCategoryService) {
  return new Elysia({ prefix: '/item-category' })
    .get(
      '/list',
      async function list({ query }) {
        const result = await service.findPaginated(query, query)
        return res.paginated(result)
      },
      {
        query: z.object({
          ...zHttp.pagination.shape,
          ...ItemCategoryFilterDto.shape,
        }),
        response: zResponse.paginated(InventorySchema.ItemCategory.array()),
      }
    )
    .get(
      '/detail',
      async function detail({ params }) {
        const category = await service.findById(params.id)
        return res.ok(category)
      },
      {
        params: zHttp.query.schemaId,
        response: zResponse.ok(InventorySchema.ItemCategory),
      }
    )
    .post(
      '/create',
      async function create({ body }) {
        const category = await service.create(body)
        return res.created(category, 'ITEM_CATEGORY_CREATED')
      },
      {
        body: ItemCategoryCreateDto,
        response: zResponse.ok(InventorySchema.ItemCategory),
      }
    )
    .put(
      '/update',
      async function update({ body }) {
        const category = await service.update(body.id, body)
        return res.ok(category, 'ITEM_CATEGORY_UPDATED')
      },
      {
        body: ItemCategoryUpdateDto,
        response: zResponse.ok(InventorySchema.ItemCategory),
      }
    )
    .delete(
      '/remove',
      async function remove({ body }) {
        await service.remove(body.id)
        return res.ok({ id: body.id }, 'ITEM_CATEGORY_DELETED')
      },
      {
        body: zSchema.recordId,
        response: zResponse.ok(z.object({ id: zPrimitive.numCoerce })),
      }
    )
}

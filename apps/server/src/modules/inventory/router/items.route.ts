import Elysia from 'elysia'
import z from 'zod'

import { res } from '@/lib/utils/response.util'
import { zHttp, zPrimitive, zResponse } from '@/lib/validation'

import { InventoryRequest, InventorySchema } from '../inventory.types'
import type { ItemsService } from '../service/item.service'

/**
 * Items Router
 */
export function buildItemsRoute(service: ItemsService) {
  return new Elysia({ prefix: '/items' })
    .get(
      '/',
      async function listItems({ query }) {
        const { search, type, categoryId, page, limit } = query

        if (page && limit) {
          const result = await service.listPaginated({ search, type, categoryId }, { page, limit })
          return res.paginated(result)
        }

        const items = await service.list({ search, type, categoryId })
        return res.ok(items)
      },
      {
        query: z.object({
          ...zHttp.pagination.shape,
          search: zHttp.query.search,
          type: z.enum(['raw', 'semi']).optional(),
          categoryId: zHttp.query.number,
        }),
        response: zResponse.paginated(InventorySchema.ItemDetail.array()),
      } as any
    )
    .get(
      '/:id',
      async function getItemById({ params }) {
        const item = await service.getById(params.id)
        return res.ok(item)
      },
      {
        params: z.object({ id: zPrimitive.numCoerce }),
        response: zResponse.ok(InventorySchema.Item),
      } as any
    )
    .post(
      '/',
      async function createItem({ body, user }) {
        const item = await service.create(body, user?.id)
        return res.created(item, 'ITEM_CREATED')
      },
      {
        isAuth: true,
        body: InventoryRequest.CreateItem,
        response: zResponse.ok(InventorySchema.Item),
      } as any
    )
    .patch(
      '/:id',
      async function updateItem({ params, body, user }) {
        const item = await service.update(params.id, body, user?.id)
        return res.ok(item, 'ITEM_UPDATED')
      },
      {
        isAuth: true,
        params: z.object({ id: zPrimitive.numCoerce }),
        body: InventoryRequest.UpdateItem,
        response: zResponse.ok(InventorySchema.Item),
      } as any
    )
    .delete(
      '/:id',
      async function deleteItem({ params }) {
        await service.delete(params.id)
        return res.ok({ id: params.id }, 'ITEM_DELETED')
      },
      {
        isAuth: true,
        params: z.object({ id: zPrimitive.numCoerce }),
        response: zResponse.ok(z.object({ id: zPrimitive.numCoerce })),
      } as any
    )
}

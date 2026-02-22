import Elysia from 'elysia'
import z from 'zod'

import { res } from '@/lib/utils/response.util'
import { zHttp, zPrimitive, zResponse, zSchema } from '@/lib/validation'

import { ItemCreateDto, ItemDto, ItemFilterDto, ItemUpdateDto } from '../dto'
import type { ItemService } from '../service'

export function buildItemRoute(service: ItemService) {
  return new Elysia({ prefix: '/item' })
    .get(
      '/list',
      async function list({ query }) {
        const result = await service.findPaginated(query, query)
        return res.paginated(result)
      },
      {
        query: z.object({
          ...zHttp.pagination.shape,
          ...ItemFilterDto.shape,
        }),
        response: zResponse.paginated(ItemDto.array()),
      }
    )
    .get(
      '/detail',
      async function detail({ params }) {
        const item = await service.findById(params.id)
        return res.ok(item)
      },
      {
        params: zHttp.query.schemaId,
        response: zResponse.ok(ItemDto),
      }
    )
    .post(
      '/create',
      async function create({ body }) {
        const { id } = await service.create(body)
        return res.created({ id }, 'ITEM_CREATED')
      },
      {
        body: ItemCreateDto,
        response: zResponse.ok(zSchema.recordId),
      }
    )
    .patch(
      '/update',
      async function update({ body }) {
        await service.update(body.id, body)
        return res.ok({ id: body.id }, 'ITEM_UPDATED')
      },
      {
        body: ItemUpdateDto,
        response: zResponse.ok(zSchema.recordId),
      }
    )
    .delete(
      '/remove',
      async function remove({ params }) {
        await service.remove(params.id)
        return res.ok({ id: params.id }, 'ITEM_DELETED')
      },
      {
        params: zHttp.query.schemaId,
        response: zResponse.ok(z.object({ id: zPrimitive.numCoerce })),
      }
    )
}

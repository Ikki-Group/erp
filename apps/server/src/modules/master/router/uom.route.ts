import Elysia from 'elysia'
import z from 'zod'

import { res } from '@/lib/utils/response.util'
import { zHttp, zResponse } from '@/lib/validation'

import { UomDto, UomFilterDto, UomMutationDto } from '../dto'
import type { UomService } from '../service/uom.service'

export function initUomRoute(service: UomService) {
  return new Elysia({ prefix: '/uom' })
    .get(
      '/list',
      async function list({ query }) {
        const { isActive, search, page, limit } = query
        const result = await service.findPaginated({ isActive, search }, { page, limit })
        return res.paginated(result)
      },
      {
        query: z.object({
          ...zHttp.pagination.shape,
          ...UomFilterDto.shape,
        }),
        response: zResponse.paginated(UomDto.array()),
      }
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const uom = await service.findByCode(query.code)
        return res.ok(uom)
      },
      {
        query: z.object({ code: z.string() }),
        response: zResponse.ok(UomDto),
      }
    )
    .post(
      '/create',
      async function create({ body }) {
        const { code } = await service.create(body)
        return res.created({ code }, 'UOM_CREATED')
      },
      {
        body: UomMutationDto,
        response: zResponse.ok(z.object({ code: z.string() })),
      }
    )
    .put(
      '/update',
      async function update({ body }) {
        const { code } = await service.update(body.code, body)
        return res.ok({ code }, 'UOM_UPDATED')
      },
      {
        body: UomMutationDto,
        response: zResponse.ok(z.object({ code: z.string() })),
      }
    )
    .delete(
      '/remove',
      async function remove({ body }) {
        await service.remove(body.code)
        return res.ok({ code: body.code }, 'UOM_REMOVED')
      },
      {
        body: z.object({ code: z.string() }),
        response: zResponse.ok(z.object({ code: z.string() })),
      }
    )
}

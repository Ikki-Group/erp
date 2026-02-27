import z from 'zod'
import { UomDto, UomMutationDto } from '../dto'
import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { zHttp, zPrimitive } from '@/lib/zod'

export const uomApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.material.uom.list,
    params: z.object({
      ...zHttp.pagination.shape,
      search: zHttp.search,
    }),
    result: zHttp.paginated(UomDto.array()),
  }),
  detail: apiFactory({
    method: 'get',
    url: endpoint.material.uom.detail,
    params: z.object({ code: zPrimitive.str }),
    result: zHttp.ok(UomDto),
  }),
  create: apiFactory({
    method: 'post',
    url: endpoint.material.uom.create,
    body: UomMutationDto,
    result: zHttp.ok(z.object({ code: zPrimitive.str })),
  }),
  update: apiFactory({
    method: 'put',
    url: endpoint.material.uom.update,
    body: UomMutationDto,
    result: zHttp.ok(z.object({ code: zPrimitive.str })),
  }),
  remove: apiFactory({
    method: 'delete',
    url: endpoint.material.uom.remove,
    params: z.object({ code: zPrimitive.str }),
    result: zHttp.ok(z.object({ code: zPrimitive.str })),
  }),
}

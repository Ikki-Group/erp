import z from 'zod'
import { UomDto, UomFilterDto, UomMutationDto } from '../dto'
import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { zHttp, zPrimitive, zSchema } from '@/lib/zod'

export const uomApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.material.uom.list,
    params: z.object({
      ...zHttp.pagination.shape,
      ...UomFilterDto.shape,
    }),
    result: zHttp.paginated(UomDto.array()),
  }),

  detail: apiFactory({
    method: 'get',
    url: endpoint.material.uom.detail,
    params: zSchema.recordId,
    result: zHttp.ok(UomDto),
  }),

  create: apiFactory({
    method: 'post',
    url: endpoint.material.uom.create,
    body: UomMutationDto,
    result: zHttp.ok(zSchema.recordId),
  }),

  update: apiFactory({
    method: 'put',
    url: endpoint.material.uom.update,
    body: z.object({
      id: zPrimitive.id,
      ...UomMutationDto.shape,
    }),
    result: zHttp.ok(zSchema.recordId),
  }),

  remove: apiFactory({
    method: 'delete',
    url: endpoint.material.uom.remove,
    params: zSchema.recordId,
    result: zHttp.ok(zSchema.recordId),
  }),
}

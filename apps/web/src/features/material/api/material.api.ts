import z from 'zod'

import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { zHttp, zPrimitive, zSchema } from '@/lib/zod'

import { MaterialFilterDto, MaterialMutationDto, MaterialOutputDto } from '../dto'

export const materialApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.material.list,
    params: z.object({ ...zHttp.pagination.shape, ...MaterialFilterDto.shape }),
    result: zHttp.paginated(MaterialOutputDto.array()),
  }),

  detail: apiFactory({
    method: 'get',
    url: endpoint.material.detail,
    params: zSchema.recordId,
    result: zHttp.ok(MaterialOutputDto),
  }),
  create: apiFactory({
    method: 'post',
    url: endpoint.material.create,
    body: MaterialMutationDto,
    result: zHttp.ok(zSchema.recordId),
  }),
  update: apiFactory({
    method: 'put',
    url: endpoint.material.update,
    body: z.object({ id: zPrimitive.id, ...MaterialMutationDto.shape }),
    result: zHttp.ok(zSchema.recordId),
  }),
  remove: apiFactory({
    method: 'delete',
    url: endpoint.material.remove,
    body: zSchema.recordId,
    result: zHttp.ok(zSchema.recordId),
  }),
}

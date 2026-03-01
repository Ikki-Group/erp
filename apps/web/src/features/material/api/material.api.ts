import z from 'zod'
import { MaterialMutationDto, MaterialSelectDto } from '../dto'
import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { zHttp, zPrimitive, zSchema } from '@/lib/zod'

export const materialApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.material.list,
    params: z.object({
      ...zHttp.pagination.shape,
      search: zHttp.search,
    }),
    result: zHttp.paginated(MaterialSelectDto.array()),
  }),
  detail: apiFactory({
    method: 'get',
    url: endpoint.material.detail,
    params: zSchema.recordId,
    result: zHttp.ok(MaterialSelectDto),
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
    body: z.object({
      id: zPrimitive.num,
      ...MaterialMutationDto.shape,
    }),
    result: zHttp.ok(zSchema.recordId),
  }),
  remove: apiFactory({
    method: 'delete',
    url: endpoint.material.remove,
    result: zHttp.ok(zSchema.recordId),
  }),
}

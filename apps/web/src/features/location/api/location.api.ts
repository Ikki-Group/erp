import z from 'zod'
import { LocationDto, LocationMutationDto } from '../dto/location.dto'
import { apiFactory } from '@/lib/api'
import { zHttp, zPrimitive, zSchema } from '@/lib/zod'
import { endpoint } from '@/config/endpoint'

export const locationApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.location.list,
    params: z.object({
      ...zHttp.pagination.shape,
      search: zHttp.search,
    }),
    result: zHttp.paginated(LocationDto.array()),
  }),
  detail: apiFactory({
    method: 'get',
    url: endpoint.location.detail,
    params: zSchema.recordId,
    result: zHttp.ok(LocationDto),
  }),
  create: apiFactory({
    method: 'post',
    url: endpoint.location.create,
    body: LocationMutationDto,
    result: zHttp.ok(zSchema.recordId),
  }),
  update: apiFactory({
    method: 'put',
    url: endpoint.location.update,
    body: z.object({
      id: zPrimitive.num,
      ...LocationMutationDto.shape,
    }),
    result: zHttp.ok(zSchema.recordId),
  }),
  remove: apiFactory({
    method: 'delete',
    url: endpoint.location.remove,
    result: zHttp.ok(zSchema.recordId),
  }),
}

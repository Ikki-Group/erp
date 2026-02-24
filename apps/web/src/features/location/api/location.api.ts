import { apiFactory } from '@/lib/api'
import { zHttp } from '@/lib/zod'
import { LocationDto } from '../dto/location.dto'
import { endpoint } from '@/config/endpoint'
import z from 'zod'

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
    result: zHttp.ok(LocationDto),
  }),
  create: apiFactory({
    method: 'post',
    url: endpoint.location.create,
    body: LocationDto,
    result: zHttp.ok(LocationDto),
  }),
  update: apiFactory({
    method: 'put',
    url: endpoint.location.update,
    body: LocationDto,
    result: zHttp.ok(LocationDto),
  }),
  remove: apiFactory({
    method: 'delete',
    url: endpoint.location.remove,
    result: zHttp.ok(LocationDto),
  }),
}

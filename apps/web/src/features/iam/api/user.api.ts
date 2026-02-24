import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { zHttp } from '@/lib/zod'
import z from 'zod'
import { UserDto } from '../dto'

export const userApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.iam.user.list,
    params: z.object({
      ...zHttp.pagination.shape,
      search: zHttp.search,
    }),
    result: zHttp.paginated(UserDto.array()),
  }),
  detail: apiFactory({
    method: 'get',
    url: endpoint.iam.user.detail,
    result: zHttp.ok(UserDto),
  }),
  create: apiFactory({
    method: 'post',
    url: endpoint.iam.user.create,
    body: UserDto,
    result: zHttp.ok(UserDto),
  }),
  update: apiFactory({
    method: 'put',
    url: endpoint.iam.user.update,
    body: UserDto,
    result: zHttp.ok(UserDto),
  }),
  remove: apiFactory({
    method: 'delete',
    url: endpoint.iam.user.remove,
    result: zHttp.ok(UserDto),
  }),
}

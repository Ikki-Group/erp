import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { zHttp, zPrimitive, zSchema } from '@/lib/zod'
import z from 'zod'
import { UserDto, UserMutationDto } from '../dto'

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
    params: zSchema.recordId,
    result: zHttp.ok(UserDto),
  }),
  create: apiFactory({
    method: 'post',
    url: endpoint.iam.user.create,
    body: UserMutationDto,
    result: zHttp.ok(zSchema.recordId),
  }),
  update: apiFactory({
    method: 'put',
    url: endpoint.iam.user.update,
    body: z.object({
      id: zPrimitive.num,
      ...UserMutationDto.omit({ password: true }).shape,
    }),
    result: zHttp.ok(zSchema.recordId),
  }),
  remove: apiFactory({
    method: 'delete',
    url: endpoint.iam.user.remove,
    result: zHttp.ok(zSchema.recordId),
  }),
}

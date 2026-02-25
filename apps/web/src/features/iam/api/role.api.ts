import { apiFactory } from '@/lib/api'
import { zHttp, zPrimitive, zSchema } from '@/lib/zod'
import { RoleDto, RoleMutationDto } from '../dto/role.dto'
import { endpoint } from '@/config/endpoint'
import z from 'zod'

export const roleApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.iam.role.list,
    params: z.object({
      ...zHttp.pagination.shape,
      search: zHttp.search,
    }),
    result: zHttp.paginated(RoleDto.array()),
  }),
  detail: apiFactory({
    method: 'get',
    url: endpoint.iam.role.detail,
    params: zSchema.recordId,
    result: zHttp.ok(RoleDto),
  }),
  create: apiFactory({
    method: 'post',
    url: endpoint.iam.role.create,
    body: RoleMutationDto,
    result: zHttp.ok(zSchema.recordId),
  }),
  update: apiFactory({
    method: 'put',
    url: endpoint.iam.role.update,
    body: z.object({
      id: zPrimitive.num,
      ...RoleMutationDto.shape,
    }),
    result: zHttp.ok(zSchema.recordId),
  }),
  remove: apiFactory({
    method: 'delete',
    url: endpoint.iam.role.remove,
    result: zHttp.ok(RoleDto),
  }),
}

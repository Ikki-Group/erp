import { apiFactory } from '@/lib/api'
import { zHttp } from '@/lib/zod'
import { RoleDto } from '../dto/role.dto'
import { endpoint } from '@/config/endpoint'

export const roleApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.iam.role.list,
    result: zHttp.paginated(RoleDto.array()),
  }),
  detail: apiFactory({
    method: 'get',
    url: endpoint.iam.role.detail,
    result: zHttp.ok(RoleDto),
  }),
  create: apiFactory({
    method: 'post',
    url: endpoint.iam.role.create,
    body: RoleDto,
    result: zHttp.ok(RoleDto),
  }),
  update: apiFactory({
    method: 'put',
    url: endpoint.iam.role.update,
    body: RoleDto,
    result: zHttp.ok(RoleDto),
  }),
  remove: apiFactory({
    method: 'delete',
    url: endpoint.iam.role.remove,
    result: zHttp.ok(RoleDto),
  }),
}

import z from 'zod'
import { RoleCreateDto, RoleDto, RoleFilterDto, RoleUpdateDto } from '../dto/role.dto'
import { apiFactory } from '@/lib/api'
import { zHttp, zPrimitive, zSchema } from '@/lib/zod'
import { endpoint } from '@/config/endpoint'

export const roleApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.iam.role.list,
    params: z.object({
      ...zHttp.pagination.shape,
      ...RoleFilterDto.shape,
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
    body: RoleCreateDto,
    result: zHttp.ok(zSchema.recordId),
  }),
  update: apiFactory({
    method: 'put',
    url: endpoint.iam.role.update,
    body: z.object({
      id: zPrimitive.id,
      ...RoleUpdateDto.shape,
    }),
    result: zHttp.ok(zSchema.recordId),
  }),
  remove: apiFactory({
    method: 'delete',
    url: endpoint.iam.role.remove,
    body: zSchema.recordId,
    result: zHttp.ok(zSchema.recordId),
  }),
}

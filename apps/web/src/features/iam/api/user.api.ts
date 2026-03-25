import z from 'zod'

import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { zHttp, zPrimitive, zSchema } from '@/lib/zod'

import {
  UserAdminUpdatePasswordDto,
  UserChangePasswordDto,
  UserCreateDto,
  UserFilterDto,
  UserOutputDto,
  UserUpdateDto,
} from '../dto'

export const userApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.iam.user.list,
    params: z.object({ ...zHttp.pagination.shape, ...UserFilterDto.shape }),
    result: zHttp.paginated(UserOutputDto.array()),
  }),
  detail: apiFactory({
    method: 'get',
    url: endpoint.iam.user.detail,
    params: zSchema.recordId,
    result: zHttp.ok(UserOutputDto),
  }),
  create: apiFactory({
    method: 'post',
    url: endpoint.iam.user.create,
    body: UserCreateDto,
    result: zHttp.ok(zSchema.recordId),
  }),
  update: apiFactory({
    method: 'put',
    url: endpoint.iam.user.update,
    body: z.object({ id: zPrimitive.id, ...UserUpdateDto.shape }),
    result: zHttp.ok(zSchema.recordId),
  }),
  remove: apiFactory({
    method: 'delete',
    url: endpoint.iam.user.remove,
    body: zSchema.recordId,
    result: zHttp.ok(zSchema.recordId),
  }),
  changePassword: apiFactory({
    method: 'put',
    url: endpoint.iam.user.changePassword,
    body: UserChangePasswordDto,
    result: zHttp.ok(zSchema.recordId),
  }),
  adminUpdatePassword: apiFactory({
    method: 'put',
    url: endpoint.iam.user.adminUpdatePassword,
    body: UserAdminUpdatePasswordDto,
    result: zHttp.ok(zSchema.recordId),
  }),
}

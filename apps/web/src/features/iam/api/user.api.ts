import z from 'zod'

import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { zId, zPaginationDto, zRecordIdDto, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/lib/zod'

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
    params: z.object({ ...zPaginationDto.shape, ...UserFilterDto.shape }),
    result: createPaginatedResponseSchema(UserOutputDto.array()),
  }),
  detail: apiFactory({
    method: 'get',
    url: endpoint.iam.user.detail,
    params: zRecordIdDto,
    result: createSuccessResponseSchema(UserOutputDto),
  }),
  create: apiFactory({
    method: 'post',
    url: endpoint.iam.user.create,
    body: UserCreateDto,
    result: createSuccessResponseSchema(zRecordIdDto),
  }),
  update: apiFactory({
    method: 'put',
    url: endpoint.iam.user.update,
    body: z.object({ id: zId, ...UserUpdateDto.shape }),
    result: createSuccessResponseSchema(zRecordIdDto),
  }),
  remove: apiFactory({
    method: 'delete',
    url: endpoint.iam.user.remove,
    body: zRecordIdDto,
    result: createSuccessResponseSchema(zRecordIdDto),
  }),
  changePassword: apiFactory({
    method: 'put',
    url: endpoint.iam.user.changePassword,
    body: UserChangePasswordDto,
    result: createSuccessResponseSchema(zRecordIdDto),
  }),
  adminUpdatePassword: apiFactory({
    method: 'put',
    url: endpoint.iam.user.adminUpdatePassword,
    body: UserAdminUpdatePasswordDto,
    result: createSuccessResponseSchema(zRecordIdDto),
  }),
}

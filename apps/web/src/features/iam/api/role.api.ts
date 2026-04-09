import z from 'zod'

import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import {
  createPaginatedResponseSchema,
  createSuccessResponseSchema,
  zId,
  zPaginationDto,
  zRecordIdDto,
} from '@/lib/zod'

import { RoleCreateDto, RoleDto, RoleFilterDto, RoleUpdateDto } from '../dto/role.dto'

export const roleApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.iam.role.list,
    params: z.object({ ...zPaginationDto.shape, ...RoleFilterDto.shape }),
    result: createPaginatedResponseSchema(RoleDto),
  }),
  detail: apiFactory({
    method: 'get',
    url: endpoint.iam.role.detail,
    params: zRecordIdDto,
    result: createSuccessResponseSchema(RoleDto),
  }),
  create: apiFactory({
    method: 'post',
    url: endpoint.iam.role.create,
    body: RoleCreateDto,
    result: createSuccessResponseSchema(zRecordIdDto),
  }),
  update: apiFactory({
    method: 'put',
    url: endpoint.iam.role.update,
    body: RoleUpdateDto,
    result: createSuccessResponseSchema(zRecordIdDto),
  }),
  remove: apiFactory({
    method: 'delete',
    url: endpoint.iam.role.remove,
    body: zRecordIdDto,
    result: createSuccessResponseSchema(zId),
  }),
}

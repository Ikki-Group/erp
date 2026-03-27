import z from 'zod'

import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { zNum, zPaginationDto, zRecordIdDto, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/lib/zod'

import { LocationDto, LocationFilterDto, LocationMutationDto } from '../dto'

export const locationApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.location.list,
    params: z.object({ ...zPaginationDto.shape, ...LocationFilterDto.shape }),
    result: createPaginatedResponseSchema(LocationDto.array()),
  }),
  detail: apiFactory({
    method: 'get',
    url: endpoint.location.detail,
    params: zRecordIdDto,
    result: createSuccessResponseSchema(LocationDto),
  }),
  create: apiFactory({
    method: 'post',
    url: endpoint.location.create,
    body: LocationMutationDto,
    result: createSuccessResponseSchema(zRecordIdDto),
  }),
  update: apiFactory({
    method: 'put',
    url: endpoint.location.update,
    body: z.object({ id: zNum, ...LocationMutationDto.shape }),
    result: createSuccessResponseSchema(zRecordIdDto),
  }),
  remove: apiFactory({ method: 'delete', url: endpoint.location.remove, result: createSuccessResponseSchema(zRecordIdDto) }),
}

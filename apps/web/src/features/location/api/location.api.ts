import z from 'zod'

import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zPaginationDto, zRecordIdDto } from '@/lib/zod'

import { LocationCreateDto, LocationDto, LocationFilterDto, LocationUpdateDto } from '../dto'

export const locationApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.location.list,
    params: z.object({ ...zPaginationDto.shape, ...LocationFilterDto.shape }),
    result: createPaginatedResponseSchema(LocationDto),
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
    body: LocationCreateDto,
    result: createSuccessResponseSchema(zRecordIdDto),
  }),
  update: apiFactory({
    method: 'put',
    url: endpoint.location.update,
    body: LocationUpdateDto,
    result: createSuccessResponseSchema(zRecordIdDto),
  }),
  remove: apiFactory({
    method: 'delete',
    url: endpoint.location.remove,
    body: zRecordIdDto,
    result: createSuccessResponseSchema(zRecordIdDto),
  }),
}

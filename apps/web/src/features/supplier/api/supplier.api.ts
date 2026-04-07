import { z } from 'zod'

import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import {
  createPaginatedResponseSchema,
  createSuccessResponseSchema,
  zPaginationDto,
  zRecordIdDto,
} from '@/lib/zod'

import {
  SupplierCreateDto,
  SupplierDto,
  SupplierFilterDto,
  SupplierUpdateDto,
} from '../dto/supplier.dto'

export const supplierApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.supplier.list,
    params: z.object({ ...SupplierFilterDto.shape, ...zPaginationDto.shape }),
    result: createPaginatedResponseSchema(SupplierDto),
  }),
  detail: apiFactory({
    method: 'get',
    url: endpoint.supplier.detail,
    params: zRecordIdDto,
    result: createSuccessResponseSchema(SupplierDto),
  }),
  create: apiFactory({
    method: 'post',
    url: endpoint.supplier.create,
    body: SupplierCreateDto,
    result: createSuccessResponseSchema(zRecordIdDto),
  }),
  update: apiFactory({
    method: 'patch',
    url: endpoint.supplier.update,
    body: SupplierUpdateDto,
    result: createSuccessResponseSchema(zRecordIdDto),
  }),
  remove: apiFactory({
    method: 'delete',
    url: endpoint.supplier.remove,
    params: zRecordIdDto,
    result: createSuccessResponseSchema(zRecordIdDto),
  }),
}

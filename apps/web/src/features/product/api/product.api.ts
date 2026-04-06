import z from 'zod'

import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { zId, zPaginationDto, zRecordIdDto, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/lib/zod'

import { ProductFilterDto, ProductMutationDto, ProductSelectDto } from '../dto'

export const productApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.product.list,
    params: z.object({ ...zPaginationDto.shape, ...ProductFilterDto.shape }),
    result: createPaginatedResponseSchema(ProductSelectDto),
  }),

  detail: apiFactory({
    method: 'get',
    url: endpoint.product.detail,
    params: zRecordIdDto,
    result: createSuccessResponseSchema(ProductSelectDto),
  }),

  create: apiFactory({
    method: 'post',
    url: endpoint.product.create,
    body: ProductMutationDto,
    result: createSuccessResponseSchema(zRecordIdDto),
  }),

  update: apiFactory({
    method: 'put',
    url: endpoint.product.update,
    body: z.object({ id: zId, ...ProductMutationDto.shape }),
    result: createSuccessResponseSchema(zRecordIdDto),
  }),

  remove: apiFactory({
    method: 'delete',
    url: endpoint.product.remove,
    params: zRecordIdDto,
    result: createSuccessResponseSchema(zRecordIdDto),
  }),
}

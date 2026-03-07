import z from 'zod'

import { ProductFilterDto, ProductMutationDto, ProductSelectDto } from '../dto'
import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { zHttp, zPrimitive, zSchema } from '@/lib/zod'


export const productApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.product.list,
    params: z.object({
      ...zHttp.pagination.shape,
      ...ProductFilterDto.shape,
    }),
    result: zHttp.paginated(ProductSelectDto.array()),
  }),
  detail: apiFactory({
    method: 'get',
    url: endpoint.product.detail,
    params: zSchema.recordId,
    result: zHttp.ok(ProductSelectDto),
  }),
  create: apiFactory({
    method: 'post',
    url: endpoint.product.create,
    body: ProductMutationDto,
    result: zHttp.ok(zSchema.recordId),
  }),
  update: apiFactory({
    method: 'put',
    url: endpoint.product.update,
    body: z.object({
      id: zPrimitive.id,
      ...ProductMutationDto.shape,
    }),
    result: zHttp.ok(zSchema.recordId),
  }),
  remove: apiFactory({
    method: 'delete',
    url: endpoint.product.remove,
    result: zHttp.ok(zSchema.recordId),
  }),
}

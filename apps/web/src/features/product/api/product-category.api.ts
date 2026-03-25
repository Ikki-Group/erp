import z from 'zod'

import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { zHttp, zPrimitive, zSchema } from '@/lib/zod'

import { ProductCategoryDto, ProductCategoryFilterDto, ProductCategoryMutationDto } from '../dto'

export const productCategoryApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.product.category.list,
    params: z.object({ ...zHttp.pagination.shape, ...ProductCategoryFilterDto.shape }),
    result: zHttp.paginated(ProductCategoryDto.array()),
  }),

  detail: apiFactory({
    method: 'get',
    url: endpoint.product.category.detail,
    params: zSchema.recordId,
    result: zHttp.ok(ProductCategoryDto),
  }),

  create: apiFactory({
    method: 'post',
    url: endpoint.product.category.create,
    body: ProductCategoryMutationDto,
    result: zHttp.ok(zSchema.recordId),
  }),

  update: apiFactory({
    method: 'put',
    url: endpoint.product.category.update,
    body: z.object({ id: zPrimitive.id, ...ProductCategoryMutationDto.shape }),
    result: zHttp.ok(zSchema.recordId),
  }),

  remove: apiFactory({
    method: 'delete',
    url: endpoint.product.category.remove,
    params: zSchema.recordId,
    result: zHttp.ok(zSchema.recordId),
  }),
}

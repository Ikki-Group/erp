import z from 'zod'
import { SalesTypeDto, SalesTypeFilterDto, SalesTypeMutationDto } from '../dto'
import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { zHttp, zPrimitive, zSchema } from '@/lib/zod'

export const salesTypeApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.product.salesType.list,
    params: z.object({
      ...zHttp.pagination.shape,
      ...SalesTypeFilterDto.shape,
    }),
    result: zHttp.paginated(SalesTypeDto.array()),
  }),

  detail: apiFactory({
    method: 'get',
    url: endpoint.product.salesType.detail,
    params: zSchema.recordId,
    result: zHttp.ok(SalesTypeDto),
  }),

  create: apiFactory({
    method: 'post',
    url: endpoint.product.salesType.create,
    body: SalesTypeMutationDto,
    result: zHttp.ok(zSchema.recordId),
  }),

  update: apiFactory({
    method: 'put',
    url: endpoint.product.salesType.update,
    body: z.object({
      id: zPrimitive.id,
      ...SalesTypeMutationDto.shape,
    }),
    result: zHttp.ok(zSchema.recordId),
  }),

  remove: apiFactory({
    method: 'delete',
    url: endpoint.product.salesType.remove,
    params: zSchema.recordId,
    result: zHttp.ok(zSchema.recordId),
  }),
}

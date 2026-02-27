import z from 'zod'
import { MaterialCategoryDto, MaterialCategoryMutationDto } from '../dto'
import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { zHttp, zPrimitive, zSchema } from '@/lib/zod'

export const materialCategoryApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.material.category.list,
    params: z.object({
      ...zHttp.pagination.shape,
      search: zHttp.search,
    }),
    result: zHttp.paginated(MaterialCategoryDto.array()),
  }),
  detail: apiFactory({
    method: 'get',
    url: endpoint.material.category.detail,
    params: zSchema.recordId,
    result: zHttp.ok(MaterialCategoryDto),
  }),
  create: apiFactory({
    method: 'post',
    url: endpoint.material.category.create,
    body: MaterialCategoryMutationDto,
    result: zHttp.ok(zSchema.recordId),
  }),
  update: apiFactory({
    method: 'put',
    url: endpoint.material.category.update,
    body: z.object({
      id: zPrimitive.num,
      ...MaterialCategoryMutationDto.shape,
    }),
    result: zHttp.ok(zSchema.recordId),
  }),
  remove: apiFactory({
    method: 'delete',
    url: endpoint.material.category.remove,
    result: zHttp.ok(zSchema.recordId),
  }),
}

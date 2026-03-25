import z from 'zod'

import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { zHttp, zPrimitive, zSchema } from '@/lib/zod'

import { RecipeFilterDto, RecipeMutationDto, RecipeOutputDto } from '../dto'

export const recipeApi = {
  list: apiFactory({
    method: 'get',
    url: endpoint.recipe.list,
    params: z.object({ ...zHttp.pagination.shape, ...RecipeFilterDto.shape }),
    result: zHttp.paginated(RecipeOutputDto.array()),
  }),

  detail: apiFactory({
    method: 'get',
    url: endpoint.recipe.detail,
    params: zSchema.recordId,
    result: zHttp.ok(RecipeOutputDto),
  }),

  create: apiFactory({
    method: 'post',
    url: endpoint.recipe.create,
    body: RecipeMutationDto,
    result: zHttp.ok(zSchema.recordId),
  }),

  update: apiFactory({
    method: 'put',
    url: endpoint.recipe.update,
    body: z.object({ id: zPrimitive.id, ...RecipeMutationDto.shape }),
    result: zHttp.ok(zSchema.recordId),
  }),

  remove: apiFactory({
    method: 'delete',
    url: endpoint.recipe.remove,
    params: zSchema.recordId,
    result: zHttp.ok(zSchema.recordId),
  }),
}

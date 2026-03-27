import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zHttp, zPrimitive, zResponse, zSchema } from '@/core/validation'

import { RecipeFilterDto, RecipeMutationDto, RecipeSelectDto } from '../dto'
import type { RecipeServiceModule } from '../service'

export function initRecipeRoute(s: RecipeServiceModule) {
  return new Elysia()
    .use(authPluginMacro)
    .get(
      '/list',
      async function list({ query }) {
        const result = await s.recipe.handleList(query, query)
        return res.paginated(result)
      },
      {
        query: z.object({ ...zHttp.pagination.shape, ...RecipeFilterDto.shape }),
        response: zResponse.paginated(RecipeSelectDto.array()),
        auth: true,
      },
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const recipe = await s.recipe.handleDetail(query.id)
        return res.ok(recipe)
      },
      { query: zHttp.recordId, response: zResponse.ok(RecipeSelectDto), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const { id } = await s.recipe.handleCreate(body, auth.userId)
        return res.created({ id })
      },
      { body: RecipeMutationDto, response: zResponse.ok(zSchema.recordId), auth: true },
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const { id } = await s.recipe.handleUpdate(body.id, body, auth.userId)
        return res.ok({ id })
      },
      {
        body: z.object({ id: zPrimitive.id, ...RecipeMutationDto.shape }),
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      },
    )
    .delete(
      '/remove',
      async function remove({ query }) {
        await s.recipe.handleRemove(query.id)
        return res.ok({ id: query.id })
      },
      { query: zHttp.recordId, response: zResponse.ok(zSchema.recordId), auth: true },
    )
}

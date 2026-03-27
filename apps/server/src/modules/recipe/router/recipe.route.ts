import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { zId, zPaginationSchema, zRecordIdSchema, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/core/validation'

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
        query: z.object({ ...zPaginationSchema.shape, ...RecipeFilterDto.shape }),
        response: createPaginatedResponseSchema(RecipeSelectDto.array()),
        auth: true,
      },
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const recipe = await s.recipe.handleDetail(query.id)
        return res.ok(recipe)
      },
      { query: zRecordIdSchema, response: createSuccessResponseSchema(RecipeSelectDto), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const { id } = await s.recipe.handleCreate(body, auth.userId)
        return res.created({ id })
      },
      { body: RecipeMutationDto, response: createSuccessResponseSchema(zRecordIdSchema), auth: true },
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const { id } = await s.recipe.handleUpdate(body.id, body, auth.userId)
        return res.ok({ id })
      },
      {
        body: z.object({ id: zId, ...RecipeMutationDto.shape }),
        response: createSuccessResponseSchema(zRecordIdSchema),
        auth: true,
      },
    )
    .delete(
      '/remove',
      async function remove({ query }) {
        await s.recipe.handleRemove(query.id)
        return res.ok({ id: query.id })
      },
      { query: zRecordIdSchema, response: createSuccessResponseSchema(zRecordIdSchema), auth: true },
    )
}

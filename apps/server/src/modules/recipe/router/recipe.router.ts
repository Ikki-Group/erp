import Elysia, { t } from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/lib/elysia/auth-plugin'
import { res } from '@/lib/utils/response.util'
import { zResponse } from '@/lib/validation'

import { RecipeDetailDto, RecipeUpsertDto } from '../dto'
import type { RecipeService } from '../service'

export function buildRecipeRouter(service: RecipeService) {
  return new Elysia({ prefix: '/recipes', tags: ['Recipe'], detail: { security: [{ BearerAuth: [] }] } })
    .use(authPluginMacro)

    .get(
      '/',
      async ({ query: { materialId, productVariantId } }) => {
        const data = await service.getRecipeByTarget({ materialId, productVariantId })
        return res.ok(data)
      },
      {
        query: t.Object({
          materialId: t.Optional(t.Numeric()),
          productVariantId: t.Optional(t.Numeric()),
        }),
        response: zResponse.ok(RecipeDetailDto),
        auth: true,
      }
    )

    .post(
      '/',
      async ({ body, auth }) => {
        const data = await service.handleUpsert(body, auth.userId)

        return res.created(data, 'Recipe saved successfully')
      },
      {
        body: RecipeUpsertDto,
        response: zResponse.ok(z.object({ id: z.number() })),

        detail: {
          summary: 'Upsert Recipe',
          description:
            'Create or fully replace a recipe for a target. This will delete all existing recipe items for the target and insert the new ones.',
        },
        auth: true,
      }
    )

    .delete(
      '/:id',
      async ({ params: { id } }) => {
        const data = await service.handleRemove(id)
        return res.ok(data, 'Recipe deleted successfully')
      },
      {
        params: t.Object({
          id: t.Numeric(),
        }),
        response: zResponse.ok(z.object({ id: z.number() })),

        detail: {
          summary: 'Delete Recipe',
          description: 'Delete a recipe entirely along with its items',
        },
        auth: true,
      }
    )
}

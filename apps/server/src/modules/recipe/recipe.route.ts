import { Elysia } from 'elysia'
import { z } from 'zod'

import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto, zq } from '@/shared/schema/index.ts'

import {
	HppResponseDto,
	RecipeCreateDto,
	RecipeDetailDto,
	RecipeDto,
	RecipeFilterDto,
	RecipeUpdateDto,
} from './recipe.contract.ts'
import type { RecipeService } from './recipe.service.ts'

// ─── Route Factory ───

export function createRecipeRoute(recipeService: RecipeService) {
	return (
		new Elysia({ prefix: '/recipe', tags: ['recipe'] })
			.use(rbac.as('scoped'))

			// ─── Reads ───

			.get(
				'/list',
				async ({ query }) => {
					const result = await recipeService.handleList(query)
					return res.paginated(result)
				},
				{ query: RecipeFilterDto, response: zRes.paginated(RecipeDto) },
			)
			.get(
				'/detail',
				async ({ query }) => {
					const result = await recipeService.handleDetail(query.id)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(RecipeDetailDto) },
			)
			.get(
				'/by-menu-item',
				async ({ query }) => {
					const result = await recipeService.handleDetailByMenuItem(query.menuItemId)
					return res.ok(result)
				},
				{
					query: z.object({ menuItemId: z.coerce.number().int().positive() }),
					response: zRes.ok(RecipeDetailDto),
				},
			)
			.get(
				'/hpp',
				async ({ query }) => {
					const result = await recipeService.handleCalculateHpp(query.menuItemId, query.locationId)
					return res.ok(result)
				},
				{
					query: z.object({
						menuItemId: z.coerce.number().int().positive(),
						locationId: z.coerce.number().int().positive(),
					}),
					response: zRes.ok(HppResponseDto),
				},
			)

			// ─── Mutations ───

			.post(
				'/create',
				async ({ body, auth }) => {
					const result = await recipeService.handleCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: RecipeCreateDto, response: zRes.created(EntityRefDto) },
			)
			.put(
				'/update',
				async ({ body, auth }) => {
					const result = await recipeService.handleUpdate(body, auth.userId)
					return res.ok(result)
				},
				{ body: RecipeUpdateDto, response: zRes.ok(EntityRefDto) },
			)
			.delete(
				'/remove',
				async ({ query, auth }) => {
					const result = await recipeService.handleDelete(query.id, auth.userId)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(EntityRefDto) },
			)
	)
}

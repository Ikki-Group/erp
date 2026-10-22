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
				async ({ query, actor }) => {
					const result = await recipeService.handleList(query, actor)
					return res.paginated(result)
				},
				{ query: RecipeFilterDto, response: zRes.paginated(RecipeDto), permission: 'recipe.read' },
			)
			.get(
				'/detail',
				async ({ query, actor }) => {
					const result = await recipeService.handleDetail(query.id, actor)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(RecipeDetailDto), permission: 'recipe.read' },
			)
			.get(
				'/by-menu-item',
				async ({ query, actor }) => {
					const result = await recipeService.handleDetailByMenuItem(query.menuItemId, actor)
					return res.ok(result)
				},
				{
					query: z.object({ menuItemId: z.coerce.number().int().positive() }),
					response: zRes.ok(RecipeDetailDto),
					permission: 'recipe.read',
				},
			)
			.get(
				'/hpp',
				async ({ query, actor }) => {
					const result = await recipeService.handleCalculateHpp(
						query.menuItemId,
						query.locationId,
						actor,
					)
					return res.ok(result)
				},
				{
					query: z.object({
						menuItemId: z.coerce.number().int().positive(),
						locationId: z.coerce.number().int().positive(),
					}),
					response: zRes.ok(HppResponseDto),
					permission: 'recipe.read',
				},
			)

			// ─── Mutations ───

			.post(
				'/create',
				async ({ body, actor }) => {
					const result = await recipeService.handleCreate(body, actor)
					return res.created(result)
				},
				{
					body: RecipeCreateDto,
					response: zRes.created(EntityRefDto),
					permission: 'recipe.create',
				},
			)
			.put(
				'/update',
				async ({ body, actor }) => {
					const result = await recipeService.handleUpdate(body, actor)
					return res.ok(result)
				},
				{ body: RecipeUpdateDto, response: zRes.ok(EntityRefDto), permission: 'recipe.update' },
			)
			.delete(
				'/remove',
				async ({ query, actor }) => {
					const result = await recipeService.handleDelete(query.id, actor)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(EntityRefDto), permission: 'recipe.delete' },
			)
	)
}

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
		new Elysia({ prefix: '/recipe', tags: ['Recipes'] })
			.use(rbac.as('scoped'))

			// ─── Reads ───

			.get(
				'/list',
				async ({ query, actor }) => {
					const result = await recipeService.handleList(query, actor)
					return res.paginated(result)
				},
				{
					query: RecipeFilterDto,
					response: zRes.paginated(RecipeDto),
					permission: 'recipe.read',
					detail: { summary: 'List recipes' },
				},
			)
			.get(
				'/detail',
				async ({ query, actor }) => {
					const result = await recipeService.handleDetail(query.id, actor)
					return res.ok(result)
				},
				{
					query: zq.recordId,
					response: zRes.ok(RecipeDetailDto),
					permission: 'recipe.read',
					detail: { summary: 'Get a recipe' },
				},
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
					detail: { summary: 'Get the active recipe of a menu item' },
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
					detail: {
						summary: 'Calculate menu item HPP',
						description:
							"Computes the cost of goods (HPP) of a menu item from its active recipe, valuing each ingredient at the moving cost price held at `locationId`, divided by the recipe's yield. Read-only.",
					},
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
					detail: {
						summary: 'Create a recipe',
						description:
							"Creates the menu item's recipe and makes it the active one; any previously active recipe for the item is deactivated.",
					},
				},
			)
			.put(
				'/update',
				async ({ body, actor }) => {
					const result = await recipeService.handleUpdate(body, actor)
					return res.ok(result)
				},
				{
					body: RecipeUpdateDto,
					response: zRes.ok(EntityRefDto),
					permission: 'recipe.update',
					detail: { summary: 'Update a recipe' },
				},
			)
			.delete(
				'/remove',
				async ({ query, actor }) => {
					const result = await recipeService.handleDelete(query.id, actor)
					return res.ok(result)
				},
				{
					query: zq.recordId,
					response: zRes.ok(EntityRefDto),
					permission: 'recipe.delete',
					detail: { summary: 'Delete a recipe' },
				},
			)
	)
}

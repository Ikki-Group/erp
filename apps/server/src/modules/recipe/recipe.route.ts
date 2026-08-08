import { Elysia } from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
import { res } from '@/shared/http/response.ts'
import { zq } from '@/shared/schema/index.ts'

import { RecipeCreateDto, RecipeFilterDto, RecipeUpdateDto } from './recipe.contract.ts'
import type { RecipeService } from './recipe.service.ts'

// ─── Route Factory ───

export function createRecipeRoute(recipeService: RecipeService) {
	return new Elysia({ prefix: '/recipe' })
		.use(authPluginMacro)

		// ─── Reads ───

		.get(
			'/list',
			async ({ query }) => {
				const result = await recipeService.handleList(query)
				return res.paginated(result)
			},
			{ query: RecipeFilterDto },
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await recipeService.handleDetail(query.id)
				return res.ok(result)
			},
			{ query: zq.recordId },
		)
		.get(
			'/by-menu-item',
			async ({ query }) => {
				const result = await recipeService.handleDetailByMenuItem(query.menuItemId)
				return res.ok(result)
			},
			{ query: z.object({ menuItemId: z.coerce.number().int().positive() }) },
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
			},
		)

		// ─── Mutations ───

		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await recipeService.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{ body: RecipeCreateDto },
		)
		.put(
			'/update',
			async ({ body, auth }) => {
				const result = await recipeService.handleUpdate(body, auth.userId)
				return res.ok(result)
			},
			{ body: RecipeUpdateDto },
		)
		.delete(
			'/remove',
			async ({ query, auth }) => {
				const result = await recipeService.handleDelete(query.id, auth.userId)
				return res.ok(result)
			},
			{ query: zq.recordId },
		)
}

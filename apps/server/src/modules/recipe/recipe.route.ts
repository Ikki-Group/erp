import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zc } from '@/shared/schema'
import { createSuccessResponseDto, createPaginatedResponseDto } from '@/shared/schema/response'

import { RecipeDto, RecipeCreateDto, RecipeFilterDto, RecipeUpdateDto, RecipeCostDto } from './recipe.contract'
import type { RecipeService } from './recipe.service'

export function createRecipeRoute(recipe: RecipeService) {
	return new Elysia()
		.use(authPluginMacro)
		.get(
			'/list',
			async (context) => {
				const result = await recipe.handleList(context.query)
				return res.paginated(result)
			},
			{
				query: RecipeFilterDto,
				response: createPaginatedResponseDto(RecipeDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async (context) => {
				const result = await recipe.handleDetail(context.query.id)
				return res.ok(result)
			},
			{
				query: zc.RecordId,
				response: createSuccessResponseDto(RecipeDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async (context) => {
				const { id } = await recipe.handleCreate(context.body, context.auth.userId)
				return res.created({ id })
			},
			{
				body: RecipeCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.put(
			'/update',
			async (context) => {
				const { id } = await recipe.handleUpdate(context.body, context.auth.userId)
				return res.ok({ id })
			},
			{
				body: RecipeUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async (context) => {
				const { id } = await recipe.handleRemove(context.query.id, context.auth.userId)
				return res.ok({ id })
			},
			{
				query: zc.RecordId,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.get(
			'/cost',
			async (context) => {
				const result = await recipe.handleCalculateCost(context.query.id)
				return res.ok(result)
			},
			{
				query: zc.RecordId,
				response: createSuccessResponseDto(RecipeCostDto),
				auth: true,
			},
		)
}

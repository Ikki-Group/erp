import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
	zc,
	zq,
	createSuccessResponseSchema,
	createPaginatedResponseSchema,
} from '@/core/validation'

import { RecipeCreateDto, RecipeFilterDto, RecipeSelectDto, RecipeUpdateDto } from '../dto'
import type { RecipeServiceModule } from '../service'

export function initRecipeRoute(s: RecipeServiceModule) {
	return new Elysia()
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await s.recipe.handleList(query)
				return res.paginated(result)
			},
			{
				query: z.object({ ...RecipeFilterDto.shape, ...zq.pagination.shape }),
				response: createPaginatedResponseSchema(RecipeSelectDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const recipe = await s.recipe.handleDetail(query.id)
				return res.ok(recipe)
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(RecipeSelectDto), auth: true },
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const { id } = await s.recipe.handleCreate(body, auth.userId)
				return res.created({ id })
			},
			{ body: RecipeCreateDto, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.put(
			'/update',
			async function update({ body, auth }) {
				const { id } = await s.recipe.handleUpdate(body, auth.userId)
				return res.ok({ id })
			},
			{
				body: RecipeUpdateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/remove',
			async function remove({ query, auth }) {
				await s.recipe.handleRemove(query.id, auth.userId)
				return res.ok({ id: query.id })
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.post(
			'/hard-remove',
			async function hardRemove({ query }) {
				await s.recipe.handleHardRemove(query.id)
				return res.ok({ id: query.id })
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.get(
			'/cost',
			async function calculateCost({ query }) {
				const result = await s.recipe.handleCalculateCost(query.id)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(z.any()), auth: true },
		)
}

import {
	zc,
	createSuccessResponseSchema,
	createPaginatedResponseSchema,
} from '@ikki/api-contract/validation'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import {
	RecipeCreateSchema,
	RecipeFilterSchema,
	RecipeSelectSchema,
	RecipeUpdateSchema,
	RecipeCostSchema,
} from './recipe.schema'
import type { RecipeService } from './recipe.service'

export function initRecipeRoute(service: RecipeService) {
	return new Elysia()
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: RecipeFilterSchema,
				response: createPaginatedResponseSchema(RecipeSelectSchema),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const recipe = await service.handleDetail(query.id)
				return res.ok(recipe)
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(RecipeSelectSchema), auth: true },
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const { id } = await service.handleCreate(body, auth.userId)
				return res.created({ id })
			},
			{ body: RecipeCreateSchema, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.put(
			'/update',
			async function update({ body, auth }) {
				const { id } = await service.handleUpdate(body, auth.userId)
				return res.ok({ id })
			},
			{
				body: RecipeUpdateSchema,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ query, auth }) {
				await service.handleRemove(query.id, auth.userId)
				return res.ok({ id: query.id })
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.post(
			'/hard-remove',
			async function hardRemove({ query }) {
				await service.handleHardRemove(query.id)
				return res.ok({ id: query.id })
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.get(
			'/cost',
			async function calculateCost({ query }) {
				const result = await service.handleCalculateCost(query.id)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(RecipeCostSchema), auth: true },
		)
}

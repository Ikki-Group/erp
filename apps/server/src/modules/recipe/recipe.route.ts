import { zc } from '@/shared/schema'
import { createSuccessResponseDto, createPaginatedResponseDto } from '@/shared/schema/response'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import {
	RecipeCreateDto,
	RecipeFilterDto,
	RecipeSelectDto,
	RecipeUpdateDto,
	RecipeCostDto,
} from './recipe.contract'
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
				query: RecipeFilterDto,
				response: createPaginatedResponseDto(RecipeDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const recipe = await service.handleDetail(query.id)
				return res.ok(recipe)
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(RecipeDto), auth: true },
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const { id } = await service.handleCreate(body, auth.userId)
				return res.created({ id })
			},
			{ body: RecipeCreateDto, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.put(
			'/update',
			async function update({ body, auth }) {
				const { id } = await service.handleUpdate(body, auth.userId)
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
			async function remove({ query, auth }) {
				await service.handleRemove(query.id, auth.userId)
				return res.ok({ id: query.id })
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.post(
			'/hard-remove',
			async function hardRemove({ query }) {
				await service.handleHardRemove(query.id)
				return res.ok({ id: query.id })
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.get(
			'/cost',
			async function calculateCost({ query }) {
				const result = await service.handleCalculateCost(query.id)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(RecipeCostDto), auth: true },
		)
}

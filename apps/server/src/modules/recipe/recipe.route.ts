import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zc } from '@/shared/schema'
import { createSuccessResponseDto, createPaginatedResponseDto } from '@/shared/schema/response'

import {
	RecipeDto,
	RecipeCreateDto,
	RecipeFilterDto,
	RecipeUpdateDto,
	RecipeCostDto,
} from './recipe.contract'
import type { RecipeService } from './recipe.service'

export function initRecipeRoute(service: RecipeService) {
	return new Elysia()
		.use(authPluginMacro)
		.get(
			'/list',
			async function list(context) {
				const result = await service.handleList(context.query)
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
			async function detail(context) {
				const recipe = await service.handleDetail(context.query.id)
				return res.ok(recipe)
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(RecipeDto), auth: true },
		)
		.post(
			'/create',
			async function create(context) {
				const { id } = await service.handleCreate(context.body, context.auth.userId)
				return res.created({ id })
			},
			{ body: RecipeCreateDto, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.put(
			'/update',
			async function update(context) {
				const { id } = await service.handleUpdate(context.body, context.auth.userId)
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
			async function remove(context) {
				await service.handleRemove(context.query.id, context.auth.userId)
				return res.ok({ id: context.query.id })
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.post(
			'/hard-remove',
			async function hardRemove(context) {
				await service.handleHardRemove(context.query.id)
				return res.ok({ id: context.query.id })
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.get(
			'/cost',
			async function calculateCost(context) {
				const result = await service.handleCalculateCost(context.query.id)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseDto(RecipeCostDto), auth: true },
		)
}

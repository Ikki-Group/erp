import z from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { zp, zc, zq, createSuccessResponseSchema, createPaginatedResponseSchema,  } from '@/lib/validation'

import { RecipeFilterDto, RecipeMutationDto, RecipeSelectDto } from '../dto'

export const recipeApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.recipe.list,
		params: z.object({ ...zq.pagination.shape, ...RecipeFilterDto.shape }),
		result: createPaginatedResponseSchema(RecipeSelectDto),
	}),

	detail: apiFactory({
		method: 'get',
		url: endpoint.recipe.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(RecipeSelectDto),
	}),

	create: apiFactory({
		method: 'post',
		url: endpoint.recipe.create,
		body: RecipeMutationDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.recipe.list],
	}),

	update: apiFactory({
		method: 'put',
		url: endpoint.recipe.update,
		body: z.object({ id: zp.id, ...RecipeMutationDto.shape }),
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.recipe.list, endpoint.recipe.detail],
	}),

	remove: apiFactory({
		method: 'delete',
		url: endpoint.recipe.remove,
		params: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.recipe.list],
	}),
}

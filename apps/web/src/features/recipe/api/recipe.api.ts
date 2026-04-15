import z from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import {
	zId,
	zPaginationDto,
	zRecordIdDto,
	createSuccessResponseSchema,
	createPaginatedResponseSchema,
} from '@/lib/zod'

import { RecipeFilterDto, RecipeMutationDto, RecipeSelectDto } from '../dto'

export const recipeApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.recipe.list,
		params: z.object({ ...zPaginationDto.shape, ...RecipeFilterDto.shape }),
		result: createPaginatedResponseSchema(RecipeSelectDto),
	}),

	detail: apiFactory({
		method: 'get',
		url: endpoint.recipe.detail,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(RecipeSelectDto),
	}),

	create: apiFactory({
		method: 'post',
		url: endpoint.recipe.create,
		body: RecipeMutationDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),

	update: apiFactory({
		method: 'put',
		url: endpoint.recipe.update,
		body: z.object({ id: zId, ...RecipeMutationDto.shape }),
		result: createSuccessResponseSchema(zRecordIdDto),
	}),

	remove: apiFactory({
		method: 'delete',
		url: endpoint.recipe.remove,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
}

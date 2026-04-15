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

import { MaterialCategoryDto, MaterialCategoryFilterDto, MaterialCategoryMutationDto } from '../dto'

export const materialCategoryApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.material.category.list,
		params: z.object({ ...zPaginationDto.shape, ...MaterialCategoryFilterDto.shape }),
		result: createPaginatedResponseSchema(MaterialCategoryDto),
	}),

	detail: apiFactory({
		method: 'get',
		url: endpoint.material.category.detail,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(MaterialCategoryDto),
	}),

	create: apiFactory({
		method: 'post',
		url: endpoint.material.category.create,
		body: MaterialCategoryMutationDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),

	update: apiFactory({
		method: 'put',
		url: endpoint.material.category.update,
		body: z.object({ id: zId, ...MaterialCategoryMutationDto.shape }),
		result: createSuccessResponseSchema(zRecordIdDto),
	}),

	remove: apiFactory({
		method: 'delete',
		url: endpoint.material.category.remove,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
}

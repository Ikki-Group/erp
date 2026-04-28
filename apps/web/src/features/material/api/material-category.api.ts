import z from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { zp, zc, zq, createSuccessResponseSchema, createPaginatedResponseSchema,  } from '@/lib/validation'

import { MaterialCategoryDto, MaterialCategoryFilterDto, MaterialCategoryMutationDto } from '../dto'

export const materialCategoryApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.material.category.list,
		params: z.object({ ...zq.pagination.shape, ...MaterialCategoryFilterDto.shape }),
		result: createPaginatedResponseSchema(MaterialCategoryDto),
	}),

	detail: apiFactory({
		method: 'get',
		url: endpoint.material.category.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(MaterialCategoryDto),
	}),

	create: apiFactory({
		method: 'post',
		url: endpoint.material.category.create,
		body: MaterialCategoryMutationDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.material.category.list],
	}),

	update: apiFactory({
		method: 'put',
		url: endpoint.material.category.update,
		body: z.object({ id: zp.id, ...MaterialCategoryMutationDto.shape }),
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.material.category.list, endpoint.material.category.detail],
	}),

	remove: apiFactory({
		method: 'delete',
		url: endpoint.material.category.remove,
		params: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.material.category.list],
	}),
}

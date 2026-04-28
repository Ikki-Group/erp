import z from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import {
	zc,
	zq,
	createSuccessResponseSchema,
	createPaginatedResponseSchema,
} from '@/lib/validation'

import {
	MaterialFilterDto,
	MaterialMutationDto,
	MaterialSelectDto,
	MaterialUpdateDto,
} from '../dto'

export const materialApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.material.list,
		params: z.object({ ...zq.pagination.shape, ...MaterialFilterDto.shape }),
		result: createPaginatedResponseSchema(MaterialSelectDto),
	}),

	detail: apiFactory({
		method: 'get',
		url: endpoint.material.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(MaterialSelectDto),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.material.create,
		body: MaterialMutationDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.material.list],
	}),
	update: apiFactory({
		method: 'put',
		url: endpoint.material.update,
		body: MaterialUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.material.list, endpoint.material.detail],
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.material.remove,
		body: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.material.list],
	}),
}

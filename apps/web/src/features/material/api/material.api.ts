import z from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory, createQueryKeys } from '@/lib/api'
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

const materialKeys = createQueryKeys('material', 'master')

export const materialApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.material.list,
		params: z.object({ ...zq.pagination.shape, ...MaterialFilterDto.shape }),
		result: createPaginatedResponseSchema(MaterialSelectDto),
		queryKey: materialKeys.list,
	}),

	detail: apiFactory({
		method: 'get',
		url: endpoint.material.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(MaterialSelectDto),
		queryKey: (params) => materialKeys.detail(params?.id),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.material.create,
		body: MaterialMutationDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [materialKeys.lists()],
	}),
	update: apiFactory({
		method: 'put',
		url: endpoint.material.update,
		body: MaterialUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [materialKeys.lists(), ({ body }) => materialKeys.detail(body.id)],
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.material.remove,
		body: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [materialKeys.lists(), ({ body }) => materialKeys.detail(body.id)],
	}),
}

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

import { MaterialFilterDto, MaterialMutationDto, MaterialSelectDto } from '../dto'

export const materialApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.material.list,
		params: z.object({ ...zPaginationDto.shape, ...MaterialFilterDto.shape }),
		result: createPaginatedResponseSchema(MaterialSelectDto),
	}),

	detail: apiFactory({
		method: 'get',
		url: endpoint.material.detail,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(MaterialSelectDto),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.material.create,
		body: MaterialMutationDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
	update: apiFactory({
		method: 'put',
		url: endpoint.material.update,
		body: z.object({ id: zId, ...MaterialMutationDto.shape }),
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.material.remove,
		body: zRecordIdDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
}

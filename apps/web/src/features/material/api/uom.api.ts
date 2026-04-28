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

import { UomDto, UomFilterDto, UomMutationDto } from '../dto'

export const uomApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.material.uom.list,
		params: z.object({ ...zPaginationDto.shape, ...UomFilterDto.shape }),
		result: createPaginatedResponseSchema(UomDto),
	}),

	detail: apiFactory({
		method: 'get',
		url: endpoint.material.uom.detail,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(UomDto),
	}),

	create: apiFactory({
		method: 'post',
		url: endpoint.material.uom.create,
		body: UomMutationDto,
		result: createSuccessResponseSchema(zRecordIdDto),
		invalidates: [endpoint.material.uom.list],
	}),

	update: apiFactory({
		method: 'put',
		url: endpoint.material.uom.update,
		body: z.object({ id: zId, ...UomMutationDto.shape }),
		result: createSuccessResponseSchema(zRecordIdDto),
		invalidates: [endpoint.material.uom.list, endpoint.material.uom.detail],
	}),

	remove: apiFactory({
		method: 'delete',
		url: endpoint.material.uom.remove,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(zRecordIdDto),
		invalidates: [endpoint.material.uom.list],
	}),
}

import z from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { zp, zc, zq, createSuccessResponseSchema, createPaginatedResponseSchema,  } from '@/lib/validation'

import { UomDto, UomFilterDto, UomMutationDto } from '../dto'

export const uomApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.material.uom.list,
		params: z.object({ ...zq.pagination.shape, ...UomFilterDto.shape }),
		result: createPaginatedResponseSchema(UomDto),
	}),

	detail: apiFactory({
		method: 'get',
		url: endpoint.material.uom.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(UomDto),
	}),

	create: apiFactory({
		method: 'post',
		url: endpoint.material.uom.create,
		body: UomMutationDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.material.uom.list],
	}),

	update: apiFactory({
		method: 'put',
		url: endpoint.material.uom.update,
		body: z.object({ id: zp.id, ...UomMutationDto.shape }),
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.material.uom.list, endpoint.material.uom.detail],
	}),

	remove: apiFactory({
		method: 'delete',
		url: endpoint.material.uom.remove,
		params: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.material.uom.list],
	}),
}

import z from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { zp, zc, zq, createSuccessResponseSchema, createPaginatedResponseSchema,  } from '@/lib/validation'

import { SalesTypeDto, SalesTypeFilterDto, SalesTypeMutationDto } from '../dto'

export const salesTypeApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.product.salesType.list,
		params: z.object({ ...zq.pagination.shape, ...SalesTypeFilterDto.shape }),
		result: createPaginatedResponseSchema(SalesTypeDto),
	}),

	detail: apiFactory({
		method: 'get',
		url: endpoint.product.salesType.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(SalesTypeDto),
	}),

	create: apiFactory({
		method: 'post',
		url: endpoint.product.salesType.create,
		body: SalesTypeMutationDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.product.salesType.list],
	}),

	update: apiFactory({
		method: 'put',
		url: endpoint.product.salesType.update,
		body: z.object({ id: zp.id, ...SalesTypeMutationDto.shape }),
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.product.salesType.list, endpoint.product.salesType.detail],
	}),

	remove: apiFactory({
		method: 'delete',
		url: endpoint.product.salesType.remove,
		params: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.product.salesType.list],
	}),
}

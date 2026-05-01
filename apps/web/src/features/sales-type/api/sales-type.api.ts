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
	SalesTypeDto,
	SalesTypeFilterDto,
	SalesTypeMutationDto,
	SalesTypeUpdateDto,
} from '../dto/sales-type.dto'

export const salesTypeApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.salesType.list,
		params: z.object({ ...zq.pagination.shape, ...SalesTypeFilterDto.shape }),
		result: createPaginatedResponseSchema(SalesTypeDto),
	}),

	detail: apiFactory({
		method: 'get',
		url: endpoint.salesType.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(SalesTypeDto),
	}),

	create: apiFactory({
		method: 'post',
		url: endpoint.salesType.create,
		body: SalesTypeMutationDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.salesType.list],
	}),

	update: apiFactory({
		method: 'put',
		url: endpoint.salesType.update,
		body: SalesTypeUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.salesType.list, endpoint.salesType.detail],
	}),

	remove: apiFactory({
		method: 'delete',
		url: endpoint.salesType.remove,
		params: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.salesType.list],
	}),
}

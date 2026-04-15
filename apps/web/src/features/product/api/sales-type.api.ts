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

import { SalesTypeDto, SalesTypeFilterDto, SalesTypeMutationDto } from '../dto'

export const salesTypeApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.product.salesType.list,
		params: z.object({ ...zPaginationDto.shape, ...SalesTypeFilterDto.shape }),
		result: createPaginatedResponseSchema(SalesTypeDto),
	}),

	detail: apiFactory({
		method: 'get',
		url: endpoint.product.salesType.detail,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(SalesTypeDto),
	}),

	create: apiFactory({
		method: 'post',
		url: endpoint.product.salesType.create,
		body: SalesTypeMutationDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),

	update: apiFactory({
		method: 'put',
		url: endpoint.product.salesType.update,
		body: z.object({ id: zId, ...SalesTypeMutationDto.shape }),
		result: createSuccessResponseSchema(zRecordIdDto),
	}),

	remove: apiFactory({
		method: 'delete',
		url: endpoint.product.salesType.remove,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
}

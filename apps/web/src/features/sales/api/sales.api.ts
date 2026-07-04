import {
	z,
	zc,
	zq,
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
} from '@/lib/validation'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'

import {
	SalesOrderAddBatchDto,
	SalesOrderCreateDto,
	SalesOrderFilterDto,
	SalesOrderSelectDto,
	SalesOrderVoidDto,
} from '../dto/sales-order.dto'

export const salesOrderApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.sales.order.list,
		params: z.object({ ...SalesOrderFilterDto.shape, ...zq.pagination.shape }),
		result: createPaginatedResponseSchema(SalesOrderSelectDto),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.sales.order.detail,
		params: zq.recordId,
		result: createSuccessResponseSchema(SalesOrderSelectDto),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.sales.order.create,
		body: SalesOrderCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.sales.order.list],
	}),
	addBatch: apiFactory({
		method: 'post',
		url: endpoint.sales.order.addBatch,
		params: zq.recordId,
		body: SalesOrderAddBatchDto,
		result: createSuccessResponseSchema(z.object({ batchId: z.number() })),
		invalidates: [endpoint.sales.order.list, endpoint.sales.order.detail],
	}),
	close: apiFactory({
		method: 'post',
		url: endpoint.sales.order.close,
		params: zq.recordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.sales.order.list, endpoint.sales.order.detail],
	}),
	void: apiFactory({
		method: 'post',
		url: endpoint.sales.order.void,
		params: zq.recordId,
		body: SalesOrderVoidDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.sales.order.list, endpoint.sales.order.detail],
	}),
}

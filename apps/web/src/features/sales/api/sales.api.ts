import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zPaginationDto,
	zRecordIdDto,
} from '@/lib/zod'

import {
	SalesOrderAddBatchDto,
	SalesOrderCreateDto,
	SalesOrderFilterDto,
	SalesOrderSelectDto,
	SalesOrderVoidDto,
} from '../dto/sales-order.dto'

import { z } from 'zod'

export const salesOrderApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.sales.order.list,
		params: z.object({ ...SalesOrderFilterDto.shape, ...zPaginationDto.shape }),
		result: createPaginatedResponseSchema(SalesOrderSelectDto),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.sales.order.detail,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(SalesOrderSelectDto),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.sales.order.create,
		body: SalesOrderCreateDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
	addBatch: apiFactory({
		method: 'post',
		url: endpoint.sales.order.addBatch,
		params: zRecordIdDto,
		body: SalesOrderAddBatchDto,
		result: createSuccessResponseSchema(z.object({ batchId: z.number() })),
	}),
	close: apiFactory({
		method: 'post',
		url: endpoint.sales.order.close,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
	void: apiFactory({
		method: 'post',
		url: endpoint.sales.order.void,
		params: zRecordIdDto,
		body: SalesOrderVoidDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
}

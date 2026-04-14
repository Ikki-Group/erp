import { z } from 'zod'

import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zPaginationDto,
	zRecordIdDto,
} from '@/lib/zod'

import {
	WorkOrderCompleteDto,
	WorkOrderCreateDto,
	WorkOrderDto,
	WorkOrderFilterDto,
	WorkOrderUpdateDto,
} from '../dto/work-order.dto'

export const workOrderApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.production.workOrder.list,
		params: z.object({ ...WorkOrderFilterDto.shape, ...zPaginationDto.shape }),
		result: createPaginatedResponseSchema(WorkOrderDto),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.production.workOrder.detail,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(WorkOrderDto),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.production.workOrder.create,
		body: WorkOrderCreateDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
	update: apiFactory({
		method: 'patch',
		url: endpoint.production.workOrder.update,
		body: WorkOrderUpdateDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.production.workOrder.remove,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
	start: apiFactory({
		method: 'post',
		url: endpoint.production.workOrder.start,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(WorkOrderDto),
	}),
	complete: apiFactory({
		method: 'post',
		url: endpoint.production.workOrder.complete,
		params: zRecordIdDto,
		body: WorkOrderCompleteDto.omit({ id: true }),
		result: createSuccessResponseSchema(WorkOrderDto),
	}),
}

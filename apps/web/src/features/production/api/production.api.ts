import { z } from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { zc, zq, createPaginatedResponseSchema, createSuccessResponseSchema } from '@/lib/validation'

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
		params: z.object({ ...WorkOrderFilterDto.shape, ...zq.pagination.shape }),
		result: createPaginatedResponseSchema(WorkOrderDto),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.production.workOrder.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(WorkOrderDto),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.production.workOrder.create,
		body: WorkOrderCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.production.workOrder.list],
	}),
	update: apiFactory({
		method: 'patch',
		url: endpoint.production.workOrder.update,
		body: WorkOrderUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.production.workOrder.list, endpoint.production.workOrder.detail],
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.production.workOrder.remove,
		params: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.production.workOrder.list],
	}),
	start: apiFactory({
		method: 'post',
		url: endpoint.production.workOrder.start,
		params: zc.RecordId,
		result: createSuccessResponseSchema(WorkOrderDto),
		invalidates: [endpoint.production.workOrder.list, endpoint.production.workOrder.detail],
	}),
	complete: apiFactory({
		method: 'post',
		url: endpoint.production.workOrder.complete,
		params: zc.RecordId,
		body: WorkOrderCompleteDto.omit({ id: true }),
		result: createSuccessResponseSchema(WorkOrderDto),
		invalidates: [
			endpoint.production.workOrder.list,
			endpoint.production.workOrder.detail,
			endpoint.inventory.summary.byLocation,
		],
	}),
}

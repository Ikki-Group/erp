import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import {
	z,
	zc,
	zq,
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
} from '@/lib/validation'

import {
	WorkOrderCompleteBodyDto,
	WorkOrderCreateDto,
	WorkOrderDto,
	WorkOrderFilterDto,
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
		body: WorkOrderCompleteBodyDto,
		result: createSuccessResponseSchema(WorkOrderDto),
		invalidates: [
			endpoint.production.workOrder.list,
			endpoint.production.workOrder.detail,
			endpoint.inventory.summary.byLocation,
		],
	}),
}

import z from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
	zq,
} from '@/lib/validation'

import { LocationCreateDto, LocationDto, LocationFilterDto, LocationUpdateDto } from '../dto'

export const locationApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.location.list,
		params: z.object({ ...zq.pagination.shape, ...LocationFilterDto.shape }),
		result: createPaginatedResponseSchema(LocationDto),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.location.detail,
		params: zq.recordId,
		result: createSuccessResponseSchema(LocationDto),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.location.create,
		body: LocationCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
	}),
	update: apiFactory({
		method: 'put',
		url: endpoint.location.update,
		body: LocationUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.location.remove,
		body: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
	}),
}

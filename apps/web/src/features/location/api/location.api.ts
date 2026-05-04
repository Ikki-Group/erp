import z from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory, createQueryKeys } from '@/lib/api'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
	zq,
} from '@/lib/validation'

import { LocationCreateDto, LocationDto, LocationFilterDto, LocationUpdateDto } from '../dto'

const locationKeys = createQueryKeys('location', 'master')

export const locationApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.location.list,
		params: z.object({ ...zq.pagination.shape, ...LocationFilterDto.shape }),
		result: createPaginatedResponseSchema(LocationDto),
		queryKey: locationKeys.list,
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.location.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(LocationDto),
		queryKey: (params) => locationKeys.detail(params?.id),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.location.create,
		body: LocationCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [
			locationKeys.lists(),
			// Invalidate inventory when location changes (stock is per location)
			endpoint.inventory.summary.byLocation,
			endpoint.inventory.summary.ledger,
			endpoint.inventoryAlert.count,
		],
	}),
	update: apiFactory({
		method: 'put',
		url: endpoint.location.update,
		body: LocationUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [
			locationKeys.lists(),
			({ body }) => locationKeys.detail(body.id),
			// Invalidate inventory when location changes (stock is per location)
			endpoint.inventory.summary.byLocation,
			endpoint.inventory.summary.ledger,
			endpoint.inventoryAlert.count,
		],
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.location.remove,
		body: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [
			locationKeys.lists(),
			({ body }) => locationKeys.detail(body.id),
			// Invalidate inventory when location changes (stock is per location)
			endpoint.inventory.summary.byLocation,
			endpoint.inventory.summary.ledger,
			endpoint.inventoryAlert.count,
		],
	}),
}

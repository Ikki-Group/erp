import { z } from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { zc, zq, createPaginatedResponseSchema, createSuccessResponseSchema } from '@/lib/validation'

import {
	SupplierCreateDto,
	SupplierDto,
	SupplierFilterDto,
	SupplierUpdateDto,
} from '../dto/supplier.dto'

export const supplierApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.supplier.list,
		params: z.object({ ...SupplierFilterDto.shape, ...zq.pagination.shape }),
		result: createPaginatedResponseSchema(SupplierDto),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.supplier.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(SupplierDto),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.supplier.create,
		body: SupplierCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.supplier.list],
	}),
	update: apiFactory({
		method: 'patch',
		url: endpoint.supplier.update,
		body: SupplierUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.supplier.list, endpoint.supplier.detail],
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.supplier.remove,
		params: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.supplier.list],
	}),
}

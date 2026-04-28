import z from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import {
	zc,
	zq,
	createSuccessResponseSchema,
	createPaginatedResponseSchema,
} from '@/lib/validation'

import { ProductFilterDto, ProductMutationDto, ProductSelectDto, ProductUpdateDto } from '../dto'

export const productApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.product.list,
		params: z.object({ ...zq.pagination.shape, ...ProductFilterDto.shape }),
		result: createPaginatedResponseSchema(ProductSelectDto),
	}),

	detail: apiFactory({
		method: 'get',
		url: endpoint.product.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(ProductSelectDto),
	}),

	create: apiFactory({
		method: 'post',
		url: endpoint.product.create,
		body: ProductMutationDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.product.list],
	}),

	update: apiFactory({
		method: 'put',
		url: endpoint.product.update,
		body: ProductUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.product.list, endpoint.product.detail],
	}),

	remove: apiFactory({
		method: 'delete',
		url: endpoint.product.remove,
		params: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.product.list],
	}),
}

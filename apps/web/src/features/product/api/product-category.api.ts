import z from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { zp, zc, zq, createSuccessResponseSchema, createPaginatedResponseSchema,  } from '@/lib/validation'

import { ProductCategoryDto, ProductCategoryFilterDto, ProductCategoryMutationDto } from '../dto'

export const productCategoryApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.product.category.list,
		params: z.object({ ...zq.pagination.shape, ...ProductCategoryFilterDto.shape }),
		result: createPaginatedResponseSchema(ProductCategoryDto),
	}),

	detail: apiFactory({
		method: 'get',
		url: endpoint.product.category.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(ProductCategoryDto),
	}),

	create: apiFactory({
		method: 'post',
		url: endpoint.product.category.create,
		body: ProductCategoryMutationDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.product.category.list],
	}),

	update: apiFactory({
		method: 'put',
		url: endpoint.product.category.update,
		body: z.object({ id: zp.id, ...ProductCategoryMutationDto.shape }),
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.product.category.list, endpoint.product.category.detail],
	}),

	remove: apiFactory({
		method: 'delete',
		url: endpoint.product.category.remove,
		params: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.product.category.list],
	}),
}

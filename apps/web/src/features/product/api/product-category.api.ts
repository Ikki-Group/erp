import z from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import {
	zId,
	zPaginationDto,
	zRecordIdDto,
	createSuccessResponseSchema,
	createPaginatedResponseSchema,
} from '@/lib/zod'

import { ProductCategoryDto, ProductCategoryFilterDto, ProductCategoryMutationDto } from '../dto'

export const productCategoryApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.product.category.list,
		params: z.object({ ...zPaginationDto.shape, ...ProductCategoryFilterDto.shape }),
		result: createPaginatedResponseSchema(ProductCategoryDto),
	}),

	detail: apiFactory({
		method: 'get',
		url: endpoint.product.category.detail,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(ProductCategoryDto),
	}),

	create: apiFactory({
		method: 'post',
		url: endpoint.product.category.create,
		body: ProductCategoryMutationDto,
		result: createSuccessResponseSchema(zRecordIdDto),
		invalidates: [endpoint.product.category.list],
	}),

	update: apiFactory({
		method: 'put',
		url: endpoint.product.category.update,
		body: z.object({ id: zId, ...ProductCategoryMutationDto.shape }),
		result: createSuccessResponseSchema(zRecordIdDto),
		invalidates: [endpoint.product.category.list, endpoint.product.category.detail],
	}),

	remove: apiFactory({
		method: 'delete',
		url: endpoint.product.category.remove,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(zRecordIdDto),
		invalidates: [endpoint.product.category.list],
	}),
}

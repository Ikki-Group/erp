import z from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory, createQueryKeys } from '@/lib/api'
import {
	zc,
	zq,
	createSuccessResponseSchema,
	createPaginatedResponseSchema,
} from '@/lib/validation'

import { UomDto, UomFilterDto, UomMutationDto, UomUpdateDto } from '../dto'

const uomKeys = createQueryKeys('material', 'uom')

export const uomApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.material.uom.list,
		params: z.object({ ...zq.pagination.shape, ...UomFilterDto.shape }),
		result: createPaginatedResponseSchema(UomDto),
		queryKey: uomKeys.list,
	}),

	detail: apiFactory({
		method: 'get',
		url: endpoint.material.uom.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(UomDto),
		queryKey: (params) => uomKeys.detail(params?.id),
	}),

	create: apiFactory({
		method: 'post',
		url: endpoint.material.uom.create,
		body: UomMutationDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [uomKeys.lists()],
	}),

	update: apiFactory({
		method: 'put',
		url: endpoint.material.uom.update,
		body: UomUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [uomKeys.lists(), ({ body }) => uomKeys.detail(body.id)],
	}),

	remove: apiFactory({
		method: 'delete',
		url: endpoint.material.uom.remove,
		params: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [uomKeys.lists(), ({ params }) => uomKeys.detail(params.id)],
	}),
}

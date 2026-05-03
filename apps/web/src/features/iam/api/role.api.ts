import z from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory, createQueryKeys } from '@/lib/api'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
	zq,
} from '@/lib/validation'

import { RoleCreateDto, RoleDto, RoleFilterDto, RoleUpdateDto } from '../dto/role.dto'

const roleKeys = createQueryKeys('iam', 'role')

export const roleApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.iam.role.list,
		params: z.object({ ...zq.pagination.shape, ...RoleFilterDto.shape }),
		result: createPaginatedResponseSchema(RoleDto),
		queryKey: roleKeys.list,
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.iam.role.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(RoleDto),
		queryKey: (params) => roleKeys.detail(params?.id),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.iam.role.create,
		body: RoleCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [roleKeys.lists()],
	}),
	update: apiFactory({
		method: 'put',
		url: endpoint.iam.role.update,
		body: RoleUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [roleKeys.lists(), ({ body }) => roleKeys.detail(body.id)],
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.iam.role.remove,
		body: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [roleKeys.lists(), ({ body }) => roleKeys.detail(body.id)],
	}),
}

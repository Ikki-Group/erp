import z from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
	zq,
} from '@/lib/validation'

import {
	UserAdminUpdatePasswordDto,
	UserChangePasswordDto,
	UserCreateDto,
	UserDto,
	UserFilterDto,
	UserUpdateDto,
} from '../dto'

export const userApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.iam.user.list,
		params: z.object({ ...zq.pagination.shape, ...UserFilterDto.shape }),
		result: createPaginatedResponseSchema(UserDto),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.iam.user.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(UserDto),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.iam.user.create,
		body: UserCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
	}),
	update: apiFactory({
		method: 'put',
		url: endpoint.iam.user.update,
		body: UserUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
	}),
	changePassword: apiFactory({
		method: 'post',
		url: endpoint.iam.user.changePassword,
		body: UserChangePasswordDto,
		result: createSuccessResponseSchema(zc.RecordId),
	}),
	adminPasswordReset: apiFactory({
		method: 'post',
		url: endpoint.iam.user.adminPasswordReset,
		body: UserAdminUpdatePasswordDto,
		result: createSuccessResponseSchema(zc.RecordId),
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.iam.user.remove,
		body: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
	}),
}

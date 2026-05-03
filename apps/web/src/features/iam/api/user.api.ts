import z from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory, createQueryKeys } from '@/lib/api'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zc } from '@/lib/validation'

import {
	UserAdminUpdatePasswordDto,
	UserChangePasswordDto,
	UserCreateDto,
	UserDetailDto,
	UserDetailResolvedDto,
	UserFilterDto,
	UserUpdateDto,
} from '../dto'

const userKeys = createQueryKeys('iam', 'user')

export const userApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.iam.user.list,
		params: z.object({ ...UserFilterDto.shape }),
		result: createPaginatedResponseSchema(UserDetailDto),
		queryKey: userKeys.list,
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.iam.user.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(UserDetailResolvedDto),
		queryKey: (params) => userKeys.detail(params?.id),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.iam.user.create,
		body: UserCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [userKeys.lists()],
	}),
	update: apiFactory({
		method: 'put',
		url: endpoint.iam.user.update,
		body: UserUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [userKeys.lists(), ({ body }) => userKeys.detail(body.id)],
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
		invalidates: [userKeys.lists(), ({ body }) => userKeys.detail(body.id)],
	}),
}

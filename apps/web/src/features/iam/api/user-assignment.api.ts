import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { createSuccessResponseSchema } from '@/lib/zod'

import {
	UserAssignmentBaseDto,
	UserAssignmentDetailDto,
	UserAssignmentFilterDto,
} from '../dto/user-assignment.dto'

import z from 'zod'

export const userAssignmentApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.iam.assignment.list,
		params: UserAssignmentFilterDto,
		result: createSuccessResponseSchema(UserAssignmentDetailDto.array()),
	}),
	assign: apiFactory({
		method: 'post',
		url: endpoint.iam.assignment.assign,
		body: UserAssignmentBaseDto.omit({ isDefault: true }),
		result: createSuccessResponseSchema(z.object({ success: z.boolean() })),
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.iam.assignment.remove,
		body: UserAssignmentBaseDto.omit({ isDefault: true, roleId: true }),
		result: createSuccessResponseSchema(z.object({ success: z.boolean() })),
	}),
}

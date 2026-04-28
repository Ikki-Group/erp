import z from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { createPaginatedResponseSchema, createSuccessResponseSchema } from '@/lib/validation'

import {
	UserAssignmentDto,
	UserAssignmentFilterDto,
	UserAssignmentUpsertDto,
} from '../dto/user-assignment.dto'

export const userAssignmentApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.iam.assignment.list,
		params: UserAssignmentFilterDto,
		result: createPaginatedResponseSchema(UserAssignmentDto.array()),
	}),
	assign: apiFactory({
		method: 'post',
		url: endpoint.iam.assignment.assign,
		body: UserAssignmentUpsertDto,
		result: createSuccessResponseSchema(z.object({ success: z.boolean() })),
		invalidates: [endpoint.iam.assignment.list],
	}),
	assignBulk: apiFactory({
		method: 'post',
		url: endpoint.iam.assignment.assignBulk,
		body: z.object({
			userIds: z.array(z.number()).min(1),
			locationId: z.number(),
			roleId: z.number(),
		}),
		result: createSuccessResponseSchema(z.object({ success: z.boolean() })),
		invalidates: [endpoint.iam.assignment.list],
	}),
	updateRoleBulk: apiFactory({
		method: 'post',
		url: endpoint.iam.assignment.updateRoleBulk,
		body: z.object({
			userIds: z.array(z.number()).min(1),
			locationId: z.number(),
			roleId: z.number(),
		}),
		result: createSuccessResponseSchema(z.object({ success: z.boolean() })),
		invalidates: [endpoint.iam.assignment.list],
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.iam.assignment.remove,
		body: z.object({
			userId: z.number(),
			locationId: z.number(),
		}),
		result: createSuccessResponseSchema(z.object({ success: z.boolean() })),
		invalidates: [endpoint.iam.assignment.list],
	}),
	removeBulk: apiFactory({
		method: 'delete',
		url: endpoint.iam.assignment.removeBulk,
		body: z.object({
			userIds: z.array(z.number()).min(1),
			locationId: z.number(),
		}),
		result: createSuccessResponseSchema(z.object({ success: z.boolean() })),
		invalidates: [endpoint.iam.assignment.list],
	}),
}

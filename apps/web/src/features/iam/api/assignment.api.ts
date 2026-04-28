import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { createPaginatedResponseSchema, successNoDataSchema } from '@/lib/validation'

import {
	AssignmentBulkBodyDto,
	AssignmentRemoveBodyDto,
	AssignmentRemoveBulkBodyDto,
	UserAssignmentDto,
	UserAssignmentFilterDto,
	UserAssignmentUpsertDto,
} from '../dto/assignment.dto'

export const assignmentApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.iam.assignment.list,
		params: UserAssignmentFilterDto,
		result: createPaginatedResponseSchema(UserAssignmentDto),
	}),
	assign: apiFactory({
		method: 'post',
		url: endpoint.iam.assignment.assign,
		body: UserAssignmentUpsertDto,
		result: successNoDataSchema,
		invalidates: [endpoint.iam.assignment.list],
	}),
	assignBulk: apiFactory({
		method: 'post',
		url: endpoint.iam.assignment.assignBulk,
		body: AssignmentBulkBodyDto,
		result: successNoDataSchema,
		invalidates: [endpoint.iam.assignment.list],
	}),
	updateRoleBulk: apiFactory({
		method: 'post',
		url: endpoint.iam.assignment.updateRoleBulk,
		body: AssignmentBulkBodyDto,
		result: successNoDataSchema,
		invalidates: [endpoint.iam.assignment.list],
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.iam.assignment.remove,
		body: AssignmentRemoveBodyDto,
		result: successNoDataSchema,
		invalidates: [endpoint.iam.assignment.list],
	}),
	removeBulk: apiFactory({
		method: 'delete',
		url: endpoint.iam.assignment.removeBulk,
		body: AssignmentRemoveBulkBodyDto,
		result: successNoDataSchema,
		invalidates: [endpoint.iam.assignment.list],
	}),
}

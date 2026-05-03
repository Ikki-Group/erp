import { endpoint } from '@/config/endpoint'

import { apiFactory, createQueryKeys } from '@/lib/api'
import { createPaginatedResponseSchema, successNoDataSchema } from '@/lib/validation'

import {
	AssignmentBulkBodyDto,
	AssignmentRemoveBodyDto,
	AssignmentRemoveBulkBodyDto,
	UserAssignmentDto,
	UserAssignmentFilterDto,
	UserAssignmentUpsertDto,
} from '../dto/assignment.dto'

const assignmentKeys = createQueryKeys('iam', 'assignment')

export const assignmentApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.iam.assignment.list,
		params: UserAssignmentFilterDto,
		result: createPaginatedResponseSchema(UserAssignmentDto),
		queryKey: assignmentKeys.list,
	}),
	assign: apiFactory({
		method: 'post',
		url: endpoint.iam.assignment.assign,
		body: UserAssignmentUpsertDto,
		result: successNoDataSchema,
		invalidates: [assignmentKeys.lists()],
	}),
	assignBulk: apiFactory({
		method: 'post',
		url: endpoint.iam.assignment.assignBulk,
		body: AssignmentBulkBodyDto,
		result: successNoDataSchema,
		invalidates: [assignmentKeys.lists()],
	}),
	updateRoleBulk: apiFactory({
		method: 'post',
		url: endpoint.iam.assignment.updateRoleBulk,
		body: AssignmentBulkBodyDto,
		result: successNoDataSchema,
		invalidates: [assignmentKeys.lists()],
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.iam.assignment.remove,
		body: AssignmentRemoveBodyDto,
		result: successNoDataSchema,
		invalidates: [assignmentKeys.lists()],
	}),
	removeBulk: apiFactory({
		method: 'delete',
		url: endpoint.iam.assignment.removeBulk,
		body: AssignmentRemoveBulkBodyDto,
		result: successNoDataSchema,
		invalidates: [assignmentKeys.lists()],
	}),
}

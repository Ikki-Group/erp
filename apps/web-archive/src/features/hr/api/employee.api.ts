import { endpoint } from '@/config/endpoint'

import { apiFactory, createQueryKeys } from '@/lib/api'
import { zc, createPaginatedResponseSchema, createSuccessResponseSchema } from '@/lib/validation'

import {
	EmployeeCreateDto,
	EmployeeDto,
	EmployeeFilterDto,
	EmployeeUpdateDto,
} from '../dto/employee.dto'

const employeeKeys = createQueryKeys('hr', 'employee')

export const employeeApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.employee.list,
		params: EmployeeFilterDto,
		result: createPaginatedResponseSchema(EmployeeDto),
		queryKey: employeeKeys.list,
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.employee.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(EmployeeDto),
		queryKey: (params) => employeeKeys.detail(params?.id),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.employee.create,
		body: EmployeeCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [employeeKeys.lists()],
	}),
	update: apiFactory({
		method: 'patch',
		url: endpoint.employee.update,
		body: EmployeeUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [employeeKeys.lists(), ({ body }) => employeeKeys.detail(body.id)],
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.employee.remove,
		params: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [employeeKeys.lists(), ({ params }) => employeeKeys.detail(params.id)],
	}),
}

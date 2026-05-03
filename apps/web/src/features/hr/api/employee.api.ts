import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { zc, createPaginatedResponseSchema, createSuccessResponseSchema } from '@/lib/validation'

import {
	EmployeeCreateDto,
	EmployeeDto,
	EmployeeFilterDto,
	EmployeeUpdateDto,
} from '../dto/employee.dto'

export const employeeApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.employee.list,
		params: EmployeeFilterDto,
		result: createPaginatedResponseSchema(EmployeeDto),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.employee.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(EmployeeDto),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.employee.create,
		body: EmployeeCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.employee.list],
	}),
	update: apiFactory({
		method: 'patch',
		url: endpoint.employee.update,
		body: EmployeeUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.employee.list, endpoint.employee.detail],
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.employee.remove,
		params: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.employee.list],
	}),
}

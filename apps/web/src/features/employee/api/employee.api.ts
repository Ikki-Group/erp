import { z } from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zPaginationDto,
	zRecordIdDto,
} from '@/lib/zod'

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
		params: z.object({ ...EmployeeFilterDto.shape, ...zPaginationDto.shape }),
		result: createPaginatedResponseSchema(EmployeeDto),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.employee.detail,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(EmployeeDto),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.employee.create,
		body: EmployeeCreateDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
	update: apiFactory({
		method: 'patch',
		url: endpoint.employee.update,
		body: EmployeeUpdateDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.employee.remove,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
}

import { z } from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { zq, createPaginatedResponseSchema, createSuccessResponseSchema } from '@/lib/validation'

import {
	AttendanceDto,
	AttendanceFilterDto,
	AttendanceSelectDto,
	ClockInDto,
	ClockOutDto,
	ShiftCreateDto,
	ShiftDto,
} from '../dto/hr.dto'
import {
	PayrollAdjustmentCreateDto,
	PayrollAdjustmentDto,
	PayrollBatchCreateDto,
	PayrollBatchDto,
} from '../dto/payroll.dto'

export const hrApi = {
	shifts: apiFactory({
		method: 'get',
		url: endpoint.hr.shifts.list,
		params: zq.pagination,
		result: createPaginatedResponseSchema(ShiftDto),
	}),
	createShift: apiFactory({
		method: 'post',
		url: endpoint.hr.shifts.create,
		body: ShiftCreateDto,
		result: createSuccessResponseSchema(ShiftDto),
		invalidates: [endpoint.hr.shifts.list],
	}),
	attendances: apiFactory({
		method: 'get',
		url: endpoint.hr.attendances.list,
		params: z.object({ ...AttendanceFilterDto.shape, ...zq.pagination.shape }),
		result: createPaginatedResponseSchema(AttendanceSelectDto),
	}),
	clockIn: apiFactory({
		method: 'post',
		url: endpoint.hr.clockIn,
		body: ClockInDto,
		result: createSuccessResponseSchema(AttendanceDto),
		invalidates: [endpoint.hr.attendances.list],
	}),
	clockOut: apiFactory({
		method: 'post',
		url: endpoint.hr.clockOut,
		body: ClockOutDto,
		result: createSuccessResponseSchema(AttendanceDto),
		invalidates: [endpoint.hr.attendances.list],
	}),
}

export const payrollApi = {
	createBatch: apiFactory({
		method: 'post',
		url: endpoint.hr.payroll.batches.create,
		body: PayrollBatchCreateDto,
		result: createSuccessResponseSchema(PayrollBatchDto),
	}),
	addAdjustment: apiFactory({
		method: 'post',
		url: endpoint.hr.payroll.adjustments.create,
		body: PayrollAdjustmentCreateDto,
		result: createSuccessResponseSchema(PayrollAdjustmentDto),
	}),
}

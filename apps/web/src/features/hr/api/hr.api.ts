import { z } from 'zod'

import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zPaginationDto } from '@/lib/zod'

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
    params: zPaginationDto,
    result: createPaginatedResponseSchema(ShiftDto),
  }),
  createShift: apiFactory({
    method: 'post',
    url: endpoint.hr.shifts.create,
    body: ShiftCreateDto,
    result: createSuccessResponseSchema(ShiftDto),
  }),
  attendances: apiFactory({
    method: 'get',
    url: endpoint.hr.attendances.list,
    params: z.object({ ...AttendanceFilterDto.shape, ...zPaginationDto.shape }),
    result: createPaginatedResponseSchema(AttendanceSelectDto),
  }),
  clockIn: apiFactory({
    method: 'post',
    url: endpoint.hr.clockIn,
    body: ClockInDto,
    result: createSuccessResponseSchema(AttendanceDto),
  }),
  clockOut: apiFactory({
    method: 'post',
    url: endpoint.hr.clockOut,
    body: ClockOutDto,
    result: createSuccessResponseSchema(AttendanceDto),
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

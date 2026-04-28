import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zq } from '@/core/validation'

import {
	AttendanceDto,
	AttendanceFilterDto,
	AttendanceSelectDto,
	ClockInDto,
	ClockOutDto,
	ShiftCreateDto,
	ShiftDto,
} from './hr.dto'
import type { HRService } from './hr.service'

export function initHRRoute(s: HRService) {
	return new Elysia({ detail: { tags: ['HR'] } })
		.use(authPluginMacro)
		.get(
			'/shifts',
			async ({ query }) => {
				const result = await s.handleShiftList(query)
				return res.paginated(result)
			},
			{ query: zq.pagination, response: createPaginatedResponseSchema(ShiftDto), auth: true },
		)
		.post(
			'/shifts',
			async ({ body, auth }) => {
				const result = await s.handleShiftCreate(body, auth.userId)
				return res.created(result)
			},
			{ body: ShiftCreateDto, response: createSuccessResponseSchema(ShiftDto), auth: true },
		)
		.get(
			'/attendances',
			async ({ query }) => {
				const result = await s.handleAttendanceList(query)
				return res.paginated(result)
			},
			{
				query: AttendanceFilterDto,
				response: createPaginatedResponseSchema(AttendanceSelectDto),
				auth: true,
			},
		)
		.post(
			'/clock-in',
			async ({ body, auth }) => {
				const result = await s.handleClockIn(body, auth.userId)
				return res.created(result)
			},
			{ body: ClockInDto, response: createSuccessResponseSchema(AttendanceDto), auth: true },
		)
		.post(
			'/clock-out',
			async ({ body, auth }) => {
				const result = await s.handleClockOut(body, auth.userId)
				return res.ok(result)
			},
			{ body: ClockOutDto, response: createSuccessResponseSchema(AttendanceDto), auth: true },
		)
}

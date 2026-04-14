import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zPaginationDto,
} from '@/core/validation'

import {
	attendanceFilterSchema,
	attendanceSchema,
	attendanceSelectSchema,
	clockInSchema,
	clockOutSchema,
	shiftCreateSchema,
	shiftSchema,
} from '../dto/hr.dto'
import type { HRService } from '../service/hr.service'

export function initHRRoute(s: HRService) {
	return new Elysia({ detail: { tags: ['HR'] } })
		.use(authPluginMacro)
		.get(
			'/shifts',
			async ({ query }) => {
				const result = await s.handleShiftList(query)
				return res.paginated(result)
			},
			{ query: zPaginationDto, response: createPaginatedResponseSchema(shiftSchema), auth: true },
		)
		.post(
			'/shifts',
			async ({ body, auth }) => {
				const result = await s.handleShiftCreate(body, auth.userId)
				return res.created(result)
			},
			{ body: shiftCreateSchema, response: createSuccessResponseSchema(shiftSchema), auth: true },
		)
		.get(
			'/attendances',
			async ({ query }) => {
				const result = await s.handleAttendanceList(query as any, query as any)
				return res.paginated(result)
			},
			{
				query: z.object({ ...attendanceFilterSchema.shape, ...zPaginationDto.shape }),
				response: createPaginatedResponseSchema(attendanceSelectSchema),
				auth: true,
			},
		)
		.post(
			'/clock-in',
			async ({ body, auth }) => {
				const result = await s.handleClockIn(body as any, auth.userId)
				return res.created(result)
			},
			{ body: clockInSchema, response: createSuccessResponseSchema(attendanceSchema), auth: true },
		)
		.post(
			'/clock-out',
			async ({ body, auth }) => {
				const result = await s.handleClockOut(body as any, auth.userId)
				return res.ok(result)
			},
			{ body: clockOutSchema, response: createSuccessResponseSchema(attendanceSchema), auth: true },
		)
}

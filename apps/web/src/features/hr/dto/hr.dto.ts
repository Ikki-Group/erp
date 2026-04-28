import { z } from 'zod'

import { zp, zc, zq } from '@/lib/validation'

export const AttendanceStatusDto = z.enum(['present', 'absent', 'late', 'on_leave'])
export type AttendanceStatusDto = z.infer<typeof AttendanceStatusDto>

/* --------------------------------- SHIFT --------------------------------- */

export const ShiftDto = z.object({
	...zc.RecordId.shape,
	name: zp.str,
	startTime: z.string(), // 'HH:mm:ss'
	endTime: z.string(), // 'HH:mm:ss'
	note: z.string().nullable(),
	...zc.AuditFull.shape,
})

export type ShiftDto = z.infer<typeof ShiftDto>

export const ShiftCreateDto = z.object({
	name: zp.str,
	startTime: z
		.string()
		.regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Invalid time format (HH:mm:ss)'),
	endTime: z
		.string()
		.regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Invalid time format (HH:mm:ss)'),
	note: zp.str.optional(),
})

export type ShiftCreateDto = z.infer<typeof ShiftCreateDto>

/* ------------------------------- ATTENDANCE ------------------------------- */

export const AttendanceDto = z.object({
	...zc.RecordId.shape,
	employeeId: zp.id,
	locationId: zp.id,
	shiftId: zp.id.nullable(),

	date: z.coerce.date(),
	clockIn: z.coerce.date().nullable(),
	clockOut: z.coerce.date().nullable(),

	status: AttendanceStatusDto,
	note: z.string().nullable(),
	...zc.AuditFull.shape,
})

export type AttendanceDto = z.infer<typeof AttendanceDto>

export const AttendanceSelectDto = AttendanceDto.extend({
	employeeName: z.string().optional(),
	employeeCode: z.string().optional(),
	locationName: z.string().optional(),
	shiftName: z.string().optional(),
})

export type AttendanceSelectDto = z.infer<typeof AttendanceSelectDto>

export const AttendanceFilterDto = z.object({
	q: zq.search,
	employeeId: zp.id.optional(),
	locationId: zp.id.optional(),
	status: AttendanceStatusDto.optional(),
	dateFrom: z.coerce.date().optional(),
	dateTo: z.coerce.date().optional(),
})

export type AttendanceFilterDto = z.infer<typeof AttendanceFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const ClockInDto = z.object({
	employeeId: zp.id,
	locationId: zp.id,
	shiftId: zp.id.optional(),
	note: zp.str.optional(),
})

export type ClockInDto = z.infer<typeof ClockInDto>

export const ClockOutDto = z.object({
	id: zp.id, // attendance record id
	note: zp.str.optional(),
})

export type ClockOutDto = z.infer<typeof ClockOutDto>

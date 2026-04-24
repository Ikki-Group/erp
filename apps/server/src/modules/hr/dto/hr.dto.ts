import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

import { attendanceStatusEnum } from '@/db/schema'

/* ---------------------------------- ENUM ---------------------------------- */

export const AttendanceStatusEnum = z.enum(attendanceStatusEnum.enumValues)
export type AttendanceStatus = z.infer<typeof AttendanceStatusEnum>

/* --------------------------------- SHIFT --------------------------------- */

export const ShiftDto = z.object({
	...zc.RecordId.shape,
	name: zp.str,
	startTime: zp.str, // 'HH:mm:ss'
	endTime: zp.str, // 'HH:mm:ss'
	note: zp.strNullable,
	...zc.AuditBasic.shape,
})
export type ShiftDto = z.infer<typeof ShiftDto>

export const ShiftCreateDto = z.object({
	name: zc.strTrim.min(1).max(100),
	startTime: z
		.string()
		.regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Invalid time format (HH:mm:ss)'),
	endTime: z
		.string()
		.regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Invalid time format (HH:mm:ss)'),
	note: zc.strTrimNullable,
})
export type ShiftCreateDto = z.infer<typeof ShiftCreateDto>

export const ShiftUpdateDto = ShiftCreateDto.extend({
	...zc.RecordId.shape,
})
export type ShiftUpdateDto = z.infer<typeof ShiftUpdateDto>

/* ------------------------------- ATTENDANCE ------------------------------- */

export const AttendanceDto = z.object({
	...zc.RecordId.shape,
	employeeId: zp.id,
	locationId: zp.id,
	shiftId: zp.id.nullable(),
	date: zp.date,
	clockIn: zp.date.nullable(),
	clockOut: zp.date.nullable(),
	status: AttendanceStatusEnum,
	note: zp.strNullable,
	...zc.AuditBasic.shape,
})
export type AttendanceDto = z.infer<typeof AttendanceDto>

export const AttendanceSelectDto = AttendanceDto.extend({
	employeeName: zp.str.optional(),
	employeeCode: zp.str.optional(),
	locationName: zp.str.optional(),
	shiftName: zp.str.optional(),
})
export type AttendanceSelectDto = z.infer<typeof AttendanceSelectDto>

/* --------------------------------- FILTER --------------------------------- */

export const AttendanceFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	employeeId: zq.id.optional(),
	locationId: zq.id.optional(),
	status: AttendanceStatusEnum.optional(),
	dateFrom: z.coerce.date().optional(),
	dateTo: z.coerce.date().optional(),
})
export type AttendanceFilterDto = z.infer<typeof AttendanceFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const ClockInDto = z.object({
	employeeId: zp.id,
	locationId: zp.id,
	shiftId: zp.id.optional(),
	note: zc.strTrimNullable,
})
export type ClockInDto = z.infer<typeof ClockInDto>

export const ClockOutDto = z.object({
	id: zp.id, // attendance record id
	note: zc.strTrimNullable,
})
export type ClockOutDto = z.infer<typeof ClockOutDto>

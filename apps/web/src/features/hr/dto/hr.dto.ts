import { z } from 'zod'

import { zId, zMetadataDto, zQuerySearch, zRecordIdDto, zStr } from '@/lib/zod'

export const AttendanceStatusDto = z.enum(['present', 'absent', 'late', 'on_leave'])
export type AttendanceStatusDto = z.infer<typeof AttendanceStatusDto>

/* --------------------------------- SHIFT --------------------------------- */

export const ShiftDto = z.object({
  ...zRecordIdDto.shape,
  name: zStr,
  startTime: z.string(), // 'HH:mm:ss'
  endTime: z.string(), // 'HH:mm:ss'
  note: z.string().nullable(),
  ...zMetadataDto.shape,
})

export type ShiftDto = z.infer<typeof ShiftDto>

export const ShiftCreateDto = z.object({
  name: zStr,
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Invalid time format (HH:mm:ss)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Invalid time format (HH:mm:ss)'),
  note: zStr.optional(),
})

export type ShiftCreateDto = z.infer<typeof ShiftCreateDto>

/* ------------------------------- ATTENDANCE ------------------------------- */

export const AttendanceDto = z.object({
  ...zRecordIdDto.shape,
  employeeId: zId,
  locationId: zId,
  shiftId: zId.nullable(),

  date: z.coerce.date(),
  clockIn: z.coerce.date().nullable(),
  clockOut: z.coerce.date().nullable(),

  status: AttendanceStatusDto,
  note: z.string().nullable(),
  ...zMetadataDto.shape,
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
  q: zQuerySearch,
  employeeId: zId.optional(),
  locationId: zId.optional(),
  status: AttendanceStatusDto.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})

export type AttendanceFilterDto = z.infer<typeof AttendanceFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const ClockInDto = z.object({ employeeId: zId, locationId: zId, shiftId: zId.optional(), note: zStr.optional() })

export type ClockInDto = z.infer<typeof ClockInDto>

export const ClockOutDto = z.object({
  id: zId, // attendance record id
  note: zStr.optional(),
})

export type ClockOutDto = z.infer<typeof ClockOutDto>

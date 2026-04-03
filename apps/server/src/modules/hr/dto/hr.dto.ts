import z from 'zod'

import {
  zId,
  zStr,
  zMetadataDto,
  zRecordIdDto,
  zQuerySearch,
} from '@/core/validation'
import { attendanceStatusEnum } from '@/db/schema/hr'

export const attendanceStatusSchema = z.enum(attendanceStatusEnum.enumValues)
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>

/* --------------------------------- SHIFT --------------------------------- */

export const shiftSchema = z.object({
  ...zRecordIdDto.shape,
  name: zStr,
  startTime: z.string(), // 'HH:mm:ss'
  endTime: z.string(),   // 'HH:mm:ss'
  note: z.string().nullable(),
  ...zMetadataDto.shape,
})

export type ShiftDto = z.infer<typeof shiftSchema>

export const shiftCreateSchema = z.object({
  name: zStr,
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Invalid time format (HH:mm:ss)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Invalid time format (HH:mm:ss)'),
  note: zStr.optional(),
})

export type ShiftCreateDto = z.infer<typeof shiftCreateSchema>

/* ------------------------------- ATTENDANCE ------------------------------- */

export const attendanceSchema = z.object({
  ...zRecordIdDto.shape,
  employeeId: zId,
  locationId: zId,
  shiftId: zId.nullable(),
  
  date: z.coerce.date(),
  clockIn: z.coerce.date().nullable(),
  clockOut: z.coerce.date().nullable(),
  
  status: attendanceStatusSchema,
  note: z.string().nullable(),
  ...zMetadataDto.shape,
})

export type AttendanceDto = z.infer<typeof attendanceSchema>

export const attendanceSelectSchema = attendanceSchema.extend({
  employeeName: z.string().optional(),
  employeeCode: z.string().optional(),
  locationName: z.string().optional(),
  shiftName: z.string().optional(),
})

export type AttendanceSelectDto = z.infer<typeof attendanceSelectSchema>

export const attendanceFilterSchema = z.object({
  search: zQuerySearch,
  employeeId: zId.optional(),
  locationId: zId.optional(),
  status: attendanceStatusSchema.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})

export type AttendanceFilterDto = z.infer<typeof attendanceFilterSchema>

/* -------------------------------- MUTATION -------------------------------- */

export const clockInSchema = z.object({
  employeeId: zId,
  locationId: zId,
  shiftId: zId.optional(),
  note: zStr.optional(),
})

export type ClockInDto = z.infer<typeof clockInSchema>

export const clockOutSchema = z.object({
  id: zId, // attendance record id
  note: zStr.optional(),
})

export type ClockOutDto = z.infer<typeof clockOutSchema>

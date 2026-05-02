import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

import { leaveStatusEnum, leaveTypeEnum } from '@/db/schema'

/* ---------------------------------- ENUM ---------------------------------- */

export const LeaveTypeEnum = z.enum(leaveTypeEnum.enumValues)
export type LeaveType = z.infer<typeof LeaveTypeEnum>

export const LeaveStatusEnum = z.enum(leaveStatusEnum.enumValues)
export type LeaveStatus = z.infer<typeof LeaveStatusEnum>

/* -------------------------------- ENTITY --------------------------------- */

export const LeaveRequestDto = z.object({
	...zc.RecordId.shape,
	employeeId: zp.id,
	type: LeaveTypeEnum,
	status: LeaveStatusEnum,
	dateStart: zp.date,
	dateEnd: zp.date,
	reason: zp.str,
	note: zp.strNullable,
	...zc.AuditBasic.shape,
})
export type LeaveRequestDto = z.infer<typeof LeaveRequestDto>

export const LeaveRequestSelectDto = LeaveRequestDto.extend({
	employeeName: zp.str.optional(),
	employeeCode: zp.str.optional(),
})
export type LeaveRequestSelectDto = z.infer<typeof LeaveRequestSelectDto>

/* -------------------------------- MUTATION -------------------------------- */

export const LeaveRequestCreateDto = z.object({
	employeeId: zp.id,
	type: LeaveTypeEnum,
	dateStart: zp.date,
	dateEnd: zp.date,
	reason: zc.strTrim.min(5).max(500),
	note: zc.strTrimNullable,
})
export type LeaveRequestCreateDto = z.infer<typeof LeaveRequestCreateDto>

export const LeaveRequestUpdateDto = LeaveRequestCreateDto.extend({
	...zc.RecordId.shape,
})
export type LeaveRequestUpdateDto = z.infer<typeof LeaveRequestUpdateDto>

/* -------------------------------- APPROVAL -------------------------------- */

export const LeaveRequestApproveDto = z.object({
	id: zp.id,
	notes: zc.strTrim.min(5).max(500).optional().or(z.literal('')),
})
export type LeaveRequestApproveDto = z.infer<typeof LeaveRequestApproveDto>

export const LeaveRequestRejectDto = z.object({
	id: zp.id,
	reason: zc.strTrim.min(5).max(500),
})
export type LeaveRequestRejectDto = z.infer<typeof LeaveRequestRejectDto>

export const LeaveRequestCancelDto = z.object({
	id: zp.id,
	reason: zc.strTrim.min(5).max(500),
})
export type LeaveRequestCancelDto = z.infer<typeof LeaveRequestCancelDto>

/* --------------------------------- FILTER --------------------------------- */

export const LeaveRequestFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	employeeId: zq.id.optional(),
	type: LeaveTypeEnum.optional(),
	status: LeaveStatusEnum.optional(),
	dateFrom: z.coerce.date().optional(),
	dateTo: z.coerce.date().optional(),
})
export type LeaveRequestFilterDto = z.infer<typeof LeaveRequestFilterDto>

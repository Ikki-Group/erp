import { z } from 'zod'

import { zc, zp, zq } from '@/lib/validation'

/* ---------------------------------- ENTITY ---------------------------------- */

export const EmployeeDto = z.object({
	...zc.RecordId.shape,
	code: zp.str,
	name: zp.str,
	email: zp.strNullable,
	phone: zp.strNullable,
	jobTitle: zp.strNullable,
	department: zp.strNullable,
	userId: zp.id.nullable(),
	...zc.AuditBasic.shape,
})
export type EmployeeDto = z.infer<typeof EmployeeDto>

/* -------------------------------- MUTATION -------------------------------- */

const EmployeeMutationDto = z.object({
	code: zc.strTrim.uppercase().min(1).max(20),
	name: zc.fullname,
	email: zc.email.optional().nullable(),
	phone: zc.strTrim.min(5).max(20).optional().nullable(),
	jobTitle: zc.strTrimNullable,
	department: zc.strTrimNullable,
	userId: zp.id.optional().nullable(),
})

export const EmployeeCreateDto = EmployeeMutationDto
export type EmployeeCreateDto = z.infer<typeof EmployeeCreateDto>

export const EmployeeUpdateDto = EmployeeMutationDto.extend({
	...zc.RecordId.shape,
})
export type EmployeeUpdateDto = z.infer<typeof EmployeeUpdateDto>

/* ---------------------------------- FILTER ---------------------------------- */

export const EmployeeFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
})
export type EmployeeFilterDto = z.infer<typeof EmployeeFilterDto>

import { z } from 'zod'

import { zp, zc, zq } from '@/lib/validation'

export const EmployeeDto = z.object({
	...zc.RecordId.shape,
	code: zp.str,
	name: zp.str,
	email: zp.strNullable,
	phone: zp.strNullable,
	jobTitle: zp.strNullable,
	department: zp.strNullable,
	userId: zp.id.nullable(),
	...zc.AuditFull.shape,
})
export type EmployeeDto = z.infer<typeof EmployeeDto>

export const EmployeeCreateDto = z.object({
	code: zp.str,
	name: zp.str,
	email: zp.str.optional().nullable(),
	phone: zp.str.optional().nullable(),
	jobTitle: zp.str.optional().nullable(),
	department: zp.str.optional().nullable(),
	userId: zp.id.optional().nullable(),
})
export type EmployeeCreateDto = z.infer<typeof EmployeeCreateDto>

export const EmployeeUpdateDto = z.object({
	...zc.RecordId.shape,
	code: zp.str,
	name: zp.str,
	email: zp.str.optional().nullable(),
	phone: zp.str.optional().nullable(),
	jobTitle: zp.str.optional().nullable(),
	department: zp.str.optional().nullable(),
	userId: zp.id.optional().nullable(),
})
export type EmployeeUpdateDto = z.infer<typeof EmployeeUpdateDto>

export const EmployeeFilterDto = z.object({ ...zq.pagination.shape, q: zq.search })
export type EmployeeFilterDto = z.infer<typeof EmployeeFilterDto>

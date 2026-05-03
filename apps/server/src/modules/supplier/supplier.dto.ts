import { z } from 'zod'

import { zc, zp, zq } from '@/lib/validation'

/* ---------------------------------- ENTITY ---------------------------------- */

export const SupplierDto = z.object({
	...zc.RecordId.shape,
	code: zp.str,
	name: zp.str,
	email: zp.strNullable,
	phone: zp.strNullable,
	address: zp.strNullable,
	taxId: zp.strNullable,
	...zc.AuditBasic.shape,
})
export type SupplierDto = z.infer<typeof SupplierDto>

/* -------------------------------- MUTATION -------------------------------- */

const SupplierMutationDto = z.object({
	code: zc.strTrim.uppercase().min(1).max(20),
	name: zc.strTrim.min(1).max(100),
	email: zc.email.optional().nullable(),
	phone: zc.strTrim.min(5).max(20).optional().nullable(),
	address: zc.strTrimNullable,
	taxId: zc.strTrimNullable,
})

export const SupplierCreateDto = SupplierMutationDto
export type SupplierCreateDto = z.infer<typeof SupplierCreateDto>

export const SupplierUpdateDto = SupplierMutationDto.extend({
	...zc.RecordId.shape,
})
export type SupplierUpdateDto = z.infer<typeof SupplierUpdateDto>

/* ---------------------------------- FILTER ---------------------------------- */

export const SupplierFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
})
export type SupplierFilterDto = z.infer<typeof SupplierFilterDto>

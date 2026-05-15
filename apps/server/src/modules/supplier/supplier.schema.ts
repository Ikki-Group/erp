import { z, zc, zp, zq } from '@ikki/api-contract/validation'

/* ---------------------------------- ENTITY ---------------------------------- */

export const SupplierSchema = z.object({
	...zc.RecordId.shape,
	code: zp.str,
	name: zp.str,
	email: zp.strNullable,
	phone: zp.strNullable,
	address: zp.strNullable,
	taxId: zp.strNullable,
	...zc.AuditBasic.shape,
})
export type SupplierSchema = z.infer<typeof SupplierSchema>

/* -------------------------------- MUTATION -------------------------------- */

const SupplierMutationSchema = z.object({
	code: zc.strTrim.uppercase().min(1).max(20),
	name: zc.strTrim.min(1).max(100),
	email: zc.email.optional().nullable(),
	phone: zc.strTrim.min(5).max(20).optional().nullable(),
	address: zc.strTrimNullable,
	taxId: zc.strTrimNullable,
})

export const SupplierCreateSchema = SupplierMutationSchema
export type SupplierCreateSchema = z.infer<typeof SupplierCreateSchema>

export const SupplierUpdateSchema = SupplierMutationSchema.extend({
	...zc.RecordId.shape,
})
export type SupplierUpdateSchema = z.infer<typeof SupplierUpdateSchema>

/* ---------------------------------- FILTER ---------------------------------- */

export const SupplierFilterSchema = z.object({
	...zq.pagination.shape,
	q: zq.search,
})
export type SupplierFilterSchema = z.infer<typeof SupplierFilterSchema>

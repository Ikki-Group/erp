import { z, zc, zp, zq } from '@ikki/api-contract/validation'

/* ---------------------------------- ENTITY ---------------------------------- */

export const SalesTypeSchema = z.object({
	...zc.RecordId.shape,
	code: zp.str,
	name: zp.str,
	isSystem: zp.bool,
	...zc.AuditBasic.shape,
})

export type SalesTypeSchema = z.infer<typeof SalesTypeSchema>

/* --------------------------------- FILTER --------------------------------- */

export const SalesTypeFilterSchema = z.object({
	...zq.pagination.shape,
	q: zq.search,
})

export type SalesTypeFilterSchema = z.infer<typeof SalesTypeFilterSchema>

/* -------------------------------- MUTATION -------------------------------- */

export const SalesTypeMutationSchema = z.object({
	code: zc.strTrim.min(1).max(20).toUpperCase(),
	name: zc.strTrim.min(1).max(100),
	isSystem: zp.bool.default(false),
})

export const SalesTypeCreateSchema = SalesTypeMutationSchema
export type SalesTypeCreateSchema = z.infer<typeof SalesTypeCreateSchema>

export const SalesTypeUpdateSchema = SalesTypeMutationSchema.extend({
	...zc.RecordId.shape,
})
export type SalesTypeUpdateSchema = z.infer<typeof SalesTypeUpdateSchema>

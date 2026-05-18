import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema'

/* ---------------------------------- BASE ---------------------------------- */

export const MaterialUomSchema = z.object({
	id: zp.id,
	code: zp.str,
	...zc.AuditBasic.shape,
})
export type MaterialUomSchema = z.infer<typeof MaterialUomSchema>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialUomMutationSchema = z.object({
	code: zc.strTrim.min(1).max(10).toUpperCase(),
})
export type MaterialUomMutationSchema = z.infer<typeof MaterialUomMutationSchema>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialUomFilterSchema = z.object({
	...zq.pagination.shape,
	q: zq.search,
})
export type MaterialUomFilterSchema = z.infer<typeof MaterialUomFilterSchema>

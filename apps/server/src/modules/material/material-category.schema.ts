import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema'

/* ---------------------------------- BASE ---------------------------------- */

export const MaterialCategorySchema = z.object({
	id: zp.id,
	name: zp.str,
	description: zp.str.nullable(),
	...zc.AuditBasic.shape,
})
export type MaterialCategorySchema = z.infer<typeof MaterialCategorySchema>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialCategoryMutationSchema = z.object({
	name: zc.strTrim.min(1).max(100),
	description: zc.strTrimNullable,
})
export type MaterialCategoryMutationSchema = z.infer<typeof MaterialCategoryMutationSchema>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialCategoryFilterSchema = z.object({
	...zq.pagination.shape,
	q: zq.search,
})
export type MaterialCategoryFilterSchema = z.infer<typeof MaterialCategoryFilterSchema>

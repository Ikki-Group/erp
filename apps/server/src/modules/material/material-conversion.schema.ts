import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema'

/* ---------------------------------- BASE ---------------------------------- */

export const MaterialConversionSchema = z.object({
	id: zp.id,
	materialId: zp.id,
	uomId: zp.id,
	toBaseFactor: zp.str,
	...zc.AuditBasic.shape,
})
export type MaterialConversionSchema = z.infer<typeof MaterialConversionSchema>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialConversionMutationSchema = z.object({
	materialId: zp.id,
	uomId: zp.id,
	toBaseFactor: zp.decimal,
})
export type MaterialConversionMutationSchema = z.infer<typeof MaterialConversionMutationSchema>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialConversionFilterSchema = z.object({
	...zq.pagination.shape,
	materialId: zq.id.optional(),
	uomId: zq.id.optional(),
})
export type MaterialConversionFilterSchema = z.infer<typeof MaterialConversionFilterSchema>

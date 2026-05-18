import { z } from 'zod'

import { zc, zp } from '@/shared/schema'

/* ---------------------------------- BASE ---------------------------------- */

export const MaterialTypeSchema = z.enum(['raw', 'semi', 'packaging'])
export type MaterialTypeSchema = z.infer<typeof MaterialTypeSchema>

export const MaterialSchema = z.object({
	id: zp.id,
	name: zp.str,
	description: zp.strNullable,
	sku: zp.str,
	type: MaterialTypeSchema,
	categoryId: zp.id.nullable(),
	baseUomId: zp.id,
	...zc.AuditBasic.shape,
})
export type MaterialSchema = z.infer<typeof MaterialSchema>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialMutationSchema = z.object({
	name: zc.strTrim.min(3).max(100),
	description: zc.strTrimNullable,
	sku: zc.strTrim.min(3).max(50).toUpperCase(),
	type: MaterialTypeSchema,
	categoryId: zp.id.nullable(),
	baseUomId: zp.id,
	locationIds: z.array(zp.id).default([]),
	conversions: z
		.array(
			z.object({
				toBaseFactor: zp.decimal,
				uomId: zp.id,
			}),
		)
		.default([]),
})

export type MaterialMutationSchema = z.infer<typeof MaterialMutationSchema>

import { z } from 'zod'

import { zc, zp } from '@/shared/schema'

/* ---------------------------------- BASE ---------------------------------- */

export const MaterialTypeDto = z.enum(['raw', 'semi', 'packaging'])
export type MaterialTypeDto = z.infer<typeof MaterialTypeDto>

export const MaterialDto = z.object({
	id: zp.id,
	name: zp.str,
	description: zp.strNullable,
	sku: zp.str,
	type: MaterialTypeDto,
	categoryId: zp.id.nullable(),
	baseUomId: zp.id,
	...zc.AuditBasic.shape,
})
export type MaterialDto = z.infer<typeof MaterialDto>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialMutationDto = z.object({
	name: zc.strTrim.min(3).max(100),
	description: zc.strTrimNullable,
	sku: zc.strTrim.min(3).max(50).toUpperCase(),
	type: MaterialTypeDto,
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

export type MaterialMutationDto = z.infer<typeof MaterialMutationDto>
